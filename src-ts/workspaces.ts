/*/
  Just to have it all in one place: TODO real docs.
  
  - A hyloa repository can contain multiple packages.
  - A package can be local (inside the repository)
    or a library (imported from another repo through
    a package manager).
  - A program is a group of packages -- a main package
    and its dependencies.
  - A target is a collection of settings that tell the
    compiler how to compile a program.
  - Every program has exactly one target. Neither the
    repository nor packages themselves have targets.
  - A repository can contain multiple programs. These
    are specified in `project.json`.
  - A [compile server/program suite?] contains one or
    more programs [of a project TODO perhaps make it able
    to contain arbitrary programs?]. It exists so the
    computational costs of compiling/modifying a single
    package can be shared. It needs not contain all
    the programs of a project to save resources if the
    dev is only working on some parts of the project.
/*/

import { Parser as parsers } from 'lr-parser-typescript';

import { Target } from './compile-targets/targets.js';
import { fileSystemProviders, ModuleProvider } from "./module-providers.js";
import { missingMainModuleErrors, ModuleLoadTimeError, nonexistentImportAliasErrors, nonexistentModuleErrors, parseErrors, runawayRelativePathErrors, SrcRange, srcRanges } from './program/errors.js';
import { mainPath, modules, ModulePath } from "./program/modules.js";
import { Package } from './program/packages.js';
import { Project } from "./program/projects.js";
import { modulesAst } from './syntax-tree/modules-ast.js';
import { tokenizer } from './syntax-tree/tokenizer.js';
import { Folder, folders } from "./utils/fs.js";


const parser = new parsers(tokenizer, modulesAst);

export type Workspace = workspaces;
export class workspaces {
  // Project folder name in 
  private projectMap = new Map<string, Project>();
  // Package id to package.
  private externalPackageMap = new Map<string, Package>();
  
  private moduleProvider: ModuleProvider;
  
  // Uses strings instead of ModulePaths to avoid duplicates.
  // Format: `packageId:modulePath`.
  private discoveredPathMap = new Map<string, Promise<unknown>>();
  
  constructor(
    moduleProvider: ModuleProvider | Folder,
  ) {
    this.moduleProvider = moduleProvider instanceof folders
      ? new fileSystemProviders(moduleProvider)
      : moduleProvider;
  }
  
  /*/
    Attempts to load these files, in order:
    
    * `package.hyloa.json`,
    * `package.json`.
  /*/
  async loadProjectSettings(): Promise<ModuleLoadTimeError | null> {
    // TODO
    
    // this.moduleProvider.setAliases()
    
    return null;
  }
  
  // Returns null iff previously called.
  async loadProgram(programName: string): Promise<ModuleLoadTimeError[] | null> {
    const errors = await this.loadPath(mainPath, null, null);
    
    return errors;
  }
  
  async loadPath(path: ModulePath, loadedIn: ModulePath, loadedAt: SrcRange): Promise<ModuleLoadTimeError[]>
  async loadPath(path: ModulePath, loadedIn: null, loadedAt: null): Promise<ModuleLoadTimeError[]>
  
  // If called multiple times, the subsequent calls will return an empty array.
  async loadPath(
    path: ModulePath,
    loadedIn: ModulePath | null,
    loadedAt: srcRanges | null,
  ):
    Promise<ModuleLoadTimeError[]>
  {
    const stringPath = path.toString(); // TODO put the package id in there
    const promise = this.discoveredPathMap.get(stringPath);
    
    if (promise) {
      await promise;
      
      return [];
    }
    
    let resolvePromise!: () => void;
    
    this.discoveredPathMap.set(
      stringPath,
      new Promise<void>(res => resolvePromise = res),
    );
    
    const moduleSource = await this.moduleProvider.getModuleSource(path);
    
    if (moduleSource instanceof Error) {
      return [
        loadedIn
          ? new nonexistentModuleErrors(loadedIn, loadedAt!, path)
          : new missingMainModuleErrors(),
      ];
    }
    
    if (moduleSource === null) {
      return [
        // `loaded[In|At]` is only null if loading the main module,
        // and in that case `moduleSource` won't ever be null, because
        // the main module does not have an alias in its path.
        new nonexistentImportAliasErrors(loadedIn!, loadedAt!, path.alias!)
      ];
    }
    
    const moduleAst = parser.parse(moduleSource)
    
    if (!(moduleAst instanceof modulesAst)) {
      // TODO handle this better in hyloa. Probs move ParseError to the parser.
      // Also recover from recoverable parsing errors.
      return [ new parseErrors(path, 'unknown' as any, moduleAst) ];
    }
    
    const module = new modules(moduleAst, path)
    
    this.program.addModule(module);
    
    return this.loadImports(module, resolvePromise)
  }
  
  async loadImports(module: modules, resolvePromise: () => void) {  
    const allErrors: ModuleLoadTimeError[][] = await Promise.all(
      module.imports.map(
        async (imported) => {
          const importPosition: srcRanges = imported.ast.importKeyword;
          
          if (imported.importedPath === null) {
            return [
              new runawayRelativePathErrors(module.path, importPosition, imported.ast.path)
            ];
          }
          
          return this.loadPath(imported.importedPath, module.path, importPosition);
        },
      ),
    );
    
    resolvePromise();
    
    return allErrors.flat();
  }
  
  validate() {
    // TODO type checking and what not.
  }
  
  async compile(outFolder: Folder, target: Target | null = null) {
    await this.loadProgram();
    
    target === null && (target = );
    
    target.compile(outFolder, this.program);
  }
  
  // TODO some api to interact with the code, eg. read variables,
  // call functions, debug them, modify the code, etc.
  // Also a parameterless emit overload that returns the exported
  // contents of the main module.
  
  // Args will by type-checked against the parameters of the `main/entrypoints` class
  async runMain(..._args: unknown[]) {
    // TODO
  }
}
