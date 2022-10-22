import { Parser } from 'lr-parser-typescript';

import { Target } from './compile-targets/targets.js';
import { FileSystemProvider, ModuleProvider } from "./module-provider.js";
import { MissingMainModule, ModuleLoadTimeError, NonexistentImportAlias, NonexistentModule, ParseError, RunawayRelativePathError, SrcRange } from './program/error.js';
import { ExecutionContext } from "./program/execution-context.js";
import { mainPath, Module, ModulePath } from "./program/module.js";
// import { PackageSettings } from './program/package-settings.js';
import { Program } from "./program/program.js";
import { ModuleAst } from './syntax-tree/module-ast.js';
import { tokenizer } from './syntax-tree/tokenizer.js';
import { Folder } from "./utils/fs.js";


const parser = new Parser(tokenizer, ModuleAst);

enum LoadingStatus {
  readyToLoad,
  loading,
  loaded,
}

export class CompileServer {
  private loadingStatus = LoadingStatus.readyToLoad;
  
  // TODO Perhaps this should be a part of Program.
  // private packageSettings: PackageSettings | null = null;
  
  private program = new Program();
  
  // Uses strings instead of ModulePaths to avoid duplicates.
  private discoveredPaths = new Set<string>();
  
  private moduleProvider: ModuleProvider;
  
  constructor(
    moduleProvider: ModuleProvider | Folder,
  ) {
    this.moduleProvider = moduleProvider instanceof Folder
      ? new FileSystemProvider(moduleProvider)
      : moduleProvider;
  }
  
  // Returns null iff previously called.
  async load(): Promise<ModuleLoadTimeError[] | null> {
    if (this.loadingStatus !== LoadingStatus.readyToLoad) return null;
    
    this.loadingStatus = LoadingStatus.loading;
    
    const maybeError = await this.loadPackageSettings();
    
    if (maybeError) return [ maybeError ];
    
    const errors = await this.loadPath(mainPath, null, null);
    
    this.loadingStatus = LoadingStatus.loaded;
    
    return errors;
  }
  
  /*/
    Attempts to load these files, in order:
    
    * `package.hyloa.json`,
    * `package.json`.
  /*/
  async loadPackageSettings(): Promise<ModuleLoadTimeError | null> {
    // TODO
    
    // this.moduleProvider.setAliases()
    
    return null;
  }
  
  async loadPath(path: ModulePath, loadedIn: ModulePath, loadedAt: SrcRange): Promise<ModuleLoadTimeError[]>
  async loadPath(path: ModulePath, loadedIn: null, loadedAt: null): Promise<ModuleLoadTimeError[]>
  
  // If called multiple times, the subsequent calls will return an empty array.
  async loadPath(
    path: ModulePath,
    loadedIn: ModulePath | null,
    loadedAt: SrcRange | null,
  ):
    Promise<ModuleLoadTimeError[]>
  {
    if (this.discoveredPaths.has(path.toString())) return [];
    
    this.discoveredPaths.add(path.toString());
    
    const moduleSource = await this.moduleProvider.getModuleSource(path);
    
    if (moduleSource instanceof Error) {
      return [
        loadedIn
          ? new NonexistentModule(loadedIn, loadedAt!, path)
          : new MissingMainModule(),
      ];
    }
    
    if (moduleSource === null) {
      return [
        // `loaded[In|At]` is only null if loading the main module,
        // and in that case `moduleSource` won't ever be null, because
        // the main module does not have an alias in its path.
        new NonexistentImportAlias(loadedIn!, loadedAt!, path.alias!)
      ];
    }
    
    const moduleAst = parser.parse(moduleSource)
    
    if (!(moduleAst instanceof ModuleAst)) {
      // TODO handle this better in hyloa. Probs move ParseError to the parser.
      // Also recover from recoverable parsing errors.
      return [ new ParseError(path, 'unknown' as any, moduleAst) ];
    }
    
    const module = new Module(moduleAst, path)
    
    this.program.addModule(module);
    
    return this.loadImports(module)
  }
  
  async loadImports(module: Module) {  
    const allErrors: ModuleLoadTimeError[][] = await Promise.all(
      module.imports.map(
        async (imported) => {
          const importPosition: SrcRange = imported.ast.importKeyword;
          
          if (imported.importedPath === null) {
            return [
              new RunawayRelativePathError(module.path, importPosition, imported.ast.path)
            ];
          }
          
          return this.loadPath(imported.importedPath, module.path, importPosition);
        },
      ),
    );
    
    return allErrors.flat();
  }
  
  async compile(outFolder: Folder, target: Target) {
    await this.load();
    
    target.compile(outFolder, this.program);
  }
  
  // TODO some api to interact with the code, eg. read variables,
  // call functions, debug them, modify the code, etc.
  // Also a parameterless emit overload that returns the exported
  // contents of the main module.
  
  async runMain(_ctx: ExecutionContext) {
    await this.load();
    
    // TODO
  }
}