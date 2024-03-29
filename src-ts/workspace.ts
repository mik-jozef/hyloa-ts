/*/
  Just to have it all in one place: TODO real docs.
  
  - A hyloa repository/project can contain multiple
    (local) packages.
  - A package can be local (inside the repository)
    or a library (imported through a package manager).
  - A target is a collection of settings that tell the
    compiler how to compile a program. Targets are specified
    in packages.
  - A program is a package with one its target and all
    the package's dependencies (all dependencies are
    libraries).
  - A workspace contains zero or more projects. It exists
    so the computational costs of compiling/modifying
    a single package can be shared, and also as a place
    to store the projects. Not all projects / packages
    of a project need to be loaded to save resources
    if the developer is only working on some parts of
    the project.
/*/

import { Parser, SerializedParserTable } from 'lr-parser-typescript';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

import { MissingRegistry, ModuleLoadError, ModuleLoadTimeError, ModuleNotFound, OtherModuleProviderError, PackageJsonValidationError, ParseError, ProgramError, ProjectJsonError, ProjectJsonValidationError, RunawayRelativePath, SrcRange, UnknownDependency, UnknownVersionAlias, UnsupportedFileType } from './languages/errors.js';
import { HyloaModuleAst } from './languages/hyloa/ast/hyloa-module-ast.js';
import { hyloaTokenizer } from './languages/hyloa/ast/tokenizer.js';
import { Import } from './languages/import.js';
import { LyoModuleAst } from './languages/lyo/ast/lyo-module-ast.js';
import { lyoTokenizer } from './languages/lyo/ast/tokenizer.js';
import { SiresModuleAst } from './languages/sires/ast/sires-module-ast.js';
import { siresTokenizer } from './languages/sires/ast/tokenizer.js';
import { Module, ModuleAny, ModuleAst, ModulePath, ModulePathPackage } from './languages/module.js';
import { LocalPackageId, Package, PackageAny, PackageId, PackageJson, PublishedPackage, PublishedPackageId } from './languages/package.js';
import { Project, ProjectJson } from './languages/project.js';
import { FileSystemProvider, ModuleProvider } from './module-provider.js';
import { exit } from './utils/exit.js';
import { FolderHandle } from "./utils/fs.js";
import { JsonValidationError } from './utils/json-validation-error.js';
import { Target } from './compile-targets/targets.js';
import hyloaParserTable from './languages/hyloa/parser-table.json' assert { type: 'json' };
import lyoParserTable from './languages/lyo/parser-table.json' assert { type: 'json' };
import siresParserTable from './languages/sires/parser-table.json' assert { type: 'json' };


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename); // Includes `local/out`.
const parserTablePath = (lang: string) => __dirname + `/../../src-ts/languages/${lang}/parser-table.json`;

const regenerateGrammar: ('hyloa' | 'lyo' | 'sires')[] = [];

const parserMap = {
  hyloa: new Parser(HyloaModuleAst, {
    tokenizer: hyloaTokenizer,
    serializedParserTable: regenerateGrammar.includes('hyloa') ? null : hyloaParserTable as unknown as SerializedParserTable,
  }),
  lyo: new Parser(LyoModuleAst, {
    tokenizer: lyoTokenizer,
    serializedParserTable: regenerateGrammar.includes('lyo') ? null : lyoParserTable as unknown  as SerializedParserTable,
  }),
  sires: new Parser(SiresModuleAst, {
    tokenizer: siresTokenizer,
    serializedParserTable: regenerateGrammar.includes('sires') ? null : siresParserTable as unknown as SerializedParserTable,
  }),
};

regenerateGrammar.includes('hyloa') &&
    parserMap.hyloa.saveParserTable(parserTablePath('hyloa'))
      .then(() => console.log('Saved hyloa parser table.'));

regenerateGrammar.includes('lyo') &&
    parserMap.lyo.saveParserTable(parserTablePath('lyo'))
      .then(() => console.log('Saved lyo parser table.'));

regenerateGrammar.includes('sires') &&
    parserMap.sires.saveParserTable(parserTablePath('sires'))
      .then(() => console.log('Saved sires parser table.'));

type ParserInMap = typeof parserMap[keyof typeof parserMap];

function isExtensionSupported(ext: string | null) {
  return ext && ext in parserMap;
}

const runProgramDefaultOptions = {
  ignoreValidationErrors: false,
};

type RunProgramOptions = typeof runProgramDefaultOptions;

type LoadingResultFn = (loadingResult: ModuleLoadError | null) => void;

type LoadedTarget<Tgt extends string | Target> = Tgt extends string ? Target : Tgt;

type LoadAllRet<Tgt extends Target> =
  | { readyToCompile: false, error: ProjectJsonError | ModuleLoadError | PackageJsonValidationError }
  | { readyToCompile: true, errors: ModuleLoadTimeError[], target: Tgt, pkg: PackageAny }
;

export class Workspace {
  // Map from project names to projects.
  private projectMap = new Map<string, Project>();
  
  /*/
    Package id to package. Published versions of local packages
    are here too if they are depended on by other packages.
    
    The files of local (unpublished) packages are in the respective
    project in `projectMap`.
  /*/
  private installedPackageMap = new Map<string, PublishedPackage>();
  
  /*/
    Linked packages are local packages that are configured
    to overshadow an installed package. Used for development
    so that local changes to the package can be immediately
    consumed by other packages without the need to publish
    the changes zeroth.
    
    The map takes a full package reference to a local package ID.
  /*/
  private linkedPackageMap = new Map<string, LocalPackageId>();
  
  private moduleProvider: ModuleProvider;
  
  /*/
    Uses stringified `ModulePath`s to avoid duplicates.
    Format: see `ModulePath.toString`. The promise gets resolved
    when the file and all its imports are loaded.
    
    Potentially contains a module load error so that modules
    (that import that path) can register themselves as dependencies
    of paths that failed to load.
  /*/
  private discoveredPathMap = new Map<string, Promise<ModuleLoadError | null>>();
  
  constructor(
    moduleProvider: ModuleProvider | FolderHandle,
  ) {
    this.moduleProvider = moduleProvider instanceof FolderHandle
      ? new FileSystemProvider(moduleProvider)
      : moduleProvider;
  }

  // When this function is called with a certain argument
  // the zeroth time, it returns a promise's resolve function,
  // and saves the promise to `discoveredPathMap`.
  // On subsequent calls with arguments that stringify to the
  // same string, the promise is returned.
  private loadPathGuard(path: ModulePathPackage):
    Promise<ModuleLoadError | null> | LoadingResultFn
  {
    const pathString = path.toString();
    const promise = this.discoveredPathMap.get(pathString);
    
    if (promise) return promise;
    
    let markImportAsLoaded!: LoadingResultFn;
    
    this.discoveredPathMap.set(
      pathString,
      new Promise(res => markImportAsLoaded = res),
    );
    
    return markImportAsLoaded;
  }
  
  /*/
    Loading a project does not load its packages.
    
    Subsequent calls with the same project name are a no-op.
  /*/
  async loadProject(projectName: string): Promise<ProjectJsonError | null> {
    if (this.projectMap.has(projectName)) return null;
    
    const projectJsonString = await this.moduleProvider.getProjectJson(projectName);
    
    if (projectJsonString instanceof ProjectJsonError) {
      return projectJsonString;
    }
    
    const projectJsonOrError = ProjectJson.fromJson(projectJsonString);

    if (projectJsonOrError instanceof JsonValidationError) {
      return new ProjectJsonValidationError(projectName, projectJsonOrError);
    }
    
    const project = new Project(projectName, projectJsonOrError);
    
    this.projectMap.set(projectName, project);
    
    return null;
  }
  
  private async getPackageJsonString(packageId: PackageId):
    Promise<string | ModuleLoadError>
  {
    const phJsonString = await this.moduleProvider.getModuleSource(
      new ModulePath(packageId, [], 'package.hyloa.json'),
    );
    
    if (typeof phJsonString === 'string') {
      return phJsonString;
    }
    
    if (phJsonString instanceof OtherModuleProviderError) {
      return phJsonString;
    }
    
    if (!(phJsonString instanceof ModuleNotFound)) {
      exit('Programmer error - phJsonString has unknown type', phJsonString);
    }
    
    return this.moduleProvider.getModuleSource(
      new ModulePath(packageId, [], 'package.json'),
    );
  }

  private async loadPackageJson(projectJson: ProjectJson | null, packageId: PackageId):
    Promise<PackageJson | ModuleLoadError | PackageJsonValidationError>
  {
    const packageJsonString = await this.getPackageJsonString(packageId);
    
    if (packageJsonString instanceof ModuleLoadError) return packageJsonString;
    
    const packageJsonOrError = PackageJson.fromJson(projectJson, packageJsonString);
    
    if (packageJsonOrError instanceof JsonValidationError) {
      return new PackageJsonValidationError(packageId, packageJsonOrError);
    }
    
    return packageJsonOrError;
  }

  /*/
    Does not load the modules of the package.
    Subsequent calls with the same package ID are a no-op.
  /*/
  async loadPackage(packageId: PackageId):
    Promise<PackageAny | ModuleLoadError | PackageJsonValidationError>
  {
    if (packageId instanceof LocalPackageId) {
      const project = this.projectMap.get(packageId.projectName);
      
      if (!project) exit('Programmer error -- called loadPackage on a non-loaded project.');
      
      const existingPackage = project.packages.get(packageId.packageName);
      
      if (existingPackage) return existingPackage;
      
      const packageJsonOrError =
        await this.loadPackageJson(project.projectJson, packageId);
      
      if (packageJsonOrError instanceof ProgramError) return packageJsonOrError;
      
      const pkg = new Package(packageId, packageJsonOrError)
      
      project.packages.set(packageId.packageName, pkg);
      
      return pkg;
    }
    
    if (packageId instanceof PublishedPackageId) {
      const packageJsonOrError = await this.loadPackageJson(null, packageId);
      
      if (packageJsonOrError instanceof ProgramError) return packageJsonOrError;
      
      const pkg = new Package(packageId, packageJsonOrError);
      
      this.installedPackageMap.set(packageId.toString(), pkg);
      
      return pkg;
    }
    
    exit('Programmer error -- unknown package id type.', packageId);
  }
  
  // Assumes the package is loaded.
  private async getModule(path: ModulePathPackage, packageJson: PackageJson):
    Promise<ModuleAny | ModuleLoadTimeError[]>
  {
    const moduleSource = await this.moduleProvider.getModuleSource(path);
    
    if (moduleSource instanceof ModuleLoadError) {
      return [moduleSource];
    }
    
    const parser: ParserInMap | undefined =
      // "Type 'null' cannot be used as an index type.ts(2538)"
      // !!ts-expect-error It fucking can.
      parserMap[path.extension() as keyof typeof parserMap];
    
    if (!parser) exit('Programmer error -- tried to load a file with an unsupported extension.', path);
    
    const moduleAst = parser.parse(moduleSource);
    
    if (!(moduleAst instanceof ModuleAst)) {
      // TODO handle this better in hyloa. Probs move `ParseError` to the parser.
      // Also recover from recoverable parsing errors.
      return [new ParseError(path, 'unknown' as any, moduleAst)];
    }
    
    return new Module(moduleAst, path, packageJson);
  }

  // Assumes the package is already loaded.
  private addModule(path: ModulePathPackage, module: ModuleAny): void {
    if (path.packageId instanceof LocalPackageId) {
      const project = this.projectMap.get(path.packageId.projectName);
      
      if (!project) exit('Programmer error -- called loadPath with a non-loaded project.', path, module);
      
      const pkg = project.packages.get(path.packageId.packageName);
      
      if (!pkg) exit('Programmer error -- called loadPath with a non-loaded package.', path, module);
      
      pkg.addModule(module);
    } else {
      const pkg = this.installedPackageMap.get(path.packageId.toString())
      
      if (!pkg) exit('Programmer error -- called loadPath with a non-loaded package.', path, module);
      
      pkg.addModule(module);
    }
  }
  
  async loadPath(path: ModulePathPackage, loadedFrom: ModulePathPackage, loadedAt: SrcRange): Promise<ModuleLoadTimeError[]>
  async loadPath(path: ModulePathPackage, loadedFrom: null, loadedAt: null): Promise<ModuleLoadTimeError[]>
  async loadPath(path: ModulePathPackage): Promise<ModuleLoadTimeError[]>
  
  // If called multiple times, the subsequent calls will return an empty array.
  async loadPath(
    path: ModulePathPackage,
    loadedFrom: ModulePathPackage | null = null,
    loadedAt: SrcRange | null = null,
  ):
    Promise<ModuleLoadTimeError[]>
  {
    const guard = this.loadPathGuard(path);
    
    if (guard instanceof Promise) {
      const maybeError = await guard;
      
      if (maybeError && loadedFrom) {
        maybeError.importReferences.push([loadedFrom, loadedAt!]);
      }
      
      return [];
    }
    
    if (!isExtensionSupported(path.extension())) {
      const err = new UnsupportedFileType(path);
      
      guard(err);
      
      return [err];
    }
    
    const loadPackageError = await this.loadPackage(path.packageId)
    
    if (loadPackageError instanceof ProgramError) {
      loadPackageError instanceof ModuleLoadError
        ? guard(loadPackageError)
        : guard(null);
      
      return [loadPackageError];
    }
    
    const moduleOrErrors = await this.getModule(path, loadPackageError.packageJson);
    
    if (Array.isArray(moduleOrErrors)) {
      const moduleLoadError: ModuleLoadError | null = moduleOrErrors
        // This is to placate TypeScript.
        .map(err => err instanceof ModuleLoadError ? err : null)
        // There can only be one.
        .find(err => err) || null;

      guard(moduleLoadError);

      return moduleOrErrors;
    }
    
    this.addModule(path, moduleOrErrors);
    
    const errorsInImports = await this.loadImports(moduleOrErrors);
    
    guard(null);
    
    return errorsInImports;
  }
  
  private async loadImports(module: ModuleAny) {
    const allErrors: ModuleLoadTimeError[][] = await Promise.all(
      module.imports.map(
        async (imported) => {
          const { importKeyword } = imported.ast;
          const { importedPath } = imported;
          
          switch (importedPath) {
            case Import.missingDefaultRegistry:
              return [
                new MissingRegistry(module.path as ModulePathPackage, importKeyword, imported.ast.parsedPath!),
              ];
            case Import.runawayRelativePath:
              return [
                new RunawayRelativePath(module.path as ModulePathPackage, importKeyword, imported.ast.path),
              ];
            case Import.unknownDependency:
              return [
                new UnknownDependency(module.path as ModulePathPackage, importKeyword, imported.ast.parsedPath!),
              ];
            case Import.unknownVersionAlias:
              return [
                new UnknownVersionAlias(module.path as ModulePathPackage, importKeyword, imported.ast.parsedPath!.versionAlias),
              ];
            default:
              return importedPath.isPackagePath()
                ? this.loadPath(
                    importedPath,
                    // The standard library cannot import non-stlib modules.
                    module.path as ModulePathPackage,
                    importKeyword
                  )
                : [];
          }
        },
      ),
    );
    
    return allErrors.flat();
  }
  
  // Returns a reference to a loaded project.
  getProject(projectName: string) {
    const project = this.projectMap.get(projectName) ?? null;
    
    if (!project) exit(`Project "${projectName}" is not loaded.`);
    
    return project;
  }
  
  // Returns a reference to a loaded package.
  getPackage(packageId: PackageId, followLinks = true): PackageAny {
    if (packageId instanceof LocalPackageId) {
      const project = this.getProject(packageId.projectName);
      
      const pkg = project.packages.get(packageId.packageName);
    
      if (!pkg) {
        exit(
          `Package "${
            packageId.packageName
          }" is not loaded in the project "${
            packageId.projectName
          }".`,
        );
      }
      
      return pkg;
    } else {
      const id = packageId.toString();
      
      const linkedId = (followLinks && this.linkedPackageMap.get(id)) ?? null;
      
      if (linkedId) return this.getPackage(linkedId);
      
      const pkg = this.installedPackageMap.get(id) ?? null;
      
      if (!pkg) exit(`Package ${id} is not loaded.`);
      
      return pkg;
    }
  }
  
  validatePackage(
    _projectName: string,
    _packageName: string,
  ) {
    // TODO type checking and what not.
  }
  
  // A "helper" function so that the consumers of Workspace
  // do not have to make several calls for simple use cases.
  async loadAll<Tgt extends string | Target>(
    projectName: string,
    packageName: string,
    // If a string, then such a target must exist in `package.json`.
    targetOrTargetName: Tgt,
  ): Promise<LoadAllRet<LoadedTarget<Tgt>>> {
    const maybeError = await this.loadProject(projectName);
    
    if (maybeError) return { readyToCompile: false, error: maybeError };
    
    const pkg =
      await this.loadPackage(new LocalPackageId(projectName, packageName));
    
    if (!(pkg instanceof Package)) return { readyToCompile: false, error: pkg };
    
    const target = targetOrTargetName instanceof Target
      ? targetOrTargetName
      : (() => {
          const target = pkg.packageJson.targets.get(targetOrTargetName) ?? null;
          
          if (!target) {
            // TODO
            exit('Unimplemented: unknown target name.', projectName, packageName, targetOrTargetName);
          }
          
          return target;
        })()
    
    const errors = await this.loadPath(new ModulePath(pkg.id, [], 'main.hyloa'));
    
    return { readyToCompile: true, errors, target: target as LoadedTarget<Tgt>, pkg };
  }
  
  // A "helper" function so that the consumers of Workspace
  // do not have to make several calls for simple use cases.
  async compileProgram(
    outFolder: FolderHandle,
    projectName: string,
    packageName: string,
    // If a string, then such a target must exist in `package.json`.
    targetOrTargetName: string | Target,
  ) {
    const ret = await this.loadAll(projectName, packageName, targetOrTargetName);
    
    if (!ret.readyToCompile) return ret.error;
    
    await ret.target.compile(outFolder, this, ret.pkg);
    
    return ret.errors;
  }
    
    // TODO some api to interact with the code, eg. read variables,
  // call functions, debug them, modify the code, etc.
  // Also a parameterless emit overload that returns the exported
  // contents of the main module.

  // A "helper" function so that the consumers of Workspace
  // do not have to make several calls for simple use cases.
  // Args will by type-checked against the parameters of the `entrypoints` class
  async runProgram(
    _projectName: string,
    _packageName: string,
    _options: RunProgramOptions = runProgramDefaultOptions,
    ..._args: unknown[]
  ) {
    // TODO
  }
}
