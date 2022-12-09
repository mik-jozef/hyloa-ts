// @ts-ignore
type String = string; type Null = null; type Boolean = boolean; type Number = number; type BigInt = bigint; type Symbol = symbol; type Unknown = unknown; type Never = never; type Any = any; type Void = void

/*/
  Just to have it all in one place: TODO real docs.
  
  - A hyloa repository/project can contain multiple
    (local) packages.
  - A package can be local (inside the repository)
    or a library (imported through a package manager).
  - A program is a group of packages -- a main package
    and its dependencies (all dependencies are libraries).
  - A target is a collection of settings that tell the
    compiler how to compile a program.
  - Every program has exactly one target. Neither the
    repository nor packages themselves have targets.
  - A project can contain multiple programs. These are
    specified in `project.json`.
  - A workspace contains zero or more projects. It exists
    so the computational costs of compiling/modifying
    a single package can be shared, and also as a place
    to store the projects. Not all projects / programs
    of a project need to be loaded to save resources
    if the developer is only working on some parts of
    the project.
/*/

import { Parser as parsers } from 'lr-parser-typescript';

import { fileSystemProviders, ModuleProvider } from './module-providers.js';
import { ModuleLoadTimeError, unknownVersionAliasErrors, moduleNotFoundErrors, parseErrors, runawayRelativePathErrors, SrcRange, ModuleLoadError, projectJsonErrors, projectJsonValidationErrors, otherModuleProviderErrors, moduleLoadErrors, packageJsonValidationErrors, PackageJsonValidationError, programErrors, ProjectJsonError, unknownDependencyErrors, missingRegistryErrors, unsupportedFileTypeErrors } from './languages/errors.js';
import { imports } from './languages/imports.js';
import { modules, ModulePath, Module, modulePaths } from './languages/modules.js';
import { localPackageIds, Package, PackageId, PackageJson, packageJsons, packages, PublishedPackage, publishedPackageIds } from './languages/packages.js';
import { Project, ProjectJson, projectJsons, projects } from './languages/projects.js';
import { makeModuleAst } from './languages/hyloa/ast/modules-ast.js';
import { hyloaTokenizer } from './languages/hyloa/ast/tokenizer.js';
import { exit } from './utils/exit.js';
import { Folder, folders } from "./utils/fs.js";
import { jsonValidationErrors } from './utils/validationErrors.js';


const parserMap = new Map([
  [ 'hyloa', new parsers(hyloaTokenizer, makeModuleAst) ],
]);

function isExtensionSupported(ext: String | Null) {
  return ext && ext in parserMap;
}

const runProgramDefaultOptions = {
  ignoreValidationErrors: false,
};

type RunProgramOptions = typeof runProgramDefaultOptions;

type LoadingResultFn = (loadingResult: ModuleLoadError | Null) => Void;

export type Workspace = workspaces;
export class workspaces {
  // Map from project names to projects.
  private projectMap = new Map<String, Project>();
  
  /*/
    Package id to package. Published versions of local packages
    are here too if they are depended on by other packages.
    
    The files of local (unpublished) packages are in the respective
    project in `projectMap`.
  /*/
  private installedPackageMap = new Map<String, PublishedPackage>();
  
  /*/
    Linked packages are local packages that are configured
    to overshadow an installed package. Used for development
    so that local changes to the package can be immediately
    consumed by other packages without the need to publish
    the changes zeroth.
    
    The map takes a full package reference to a local package ID.
  /*/
  private linkedPackageMap = new Map<String, String>();
  
  private moduleProvider: ModuleProvider;
  
  /*/
    Uses stringified `ModulePath`s to avoid duplicates.
    Format: see `ModulePath.toString`. The promise gets resolved
    when the file and all its imports are loaded.
    
    Potentially contains a module load error so that modules
    (that import that path) can register themselves as dependencies
    of paths that failed to load.
  /*/
  private discoveredPathMap = new Map<String, Promise<ModuleLoadError | Null>>();
  
  constructor(
    moduleProvider: ModuleProvider | Folder,
  ) {
    this.moduleProvider = moduleProvider instanceof folders
      ? new fileSystemProviders(moduleProvider)
      : moduleProvider;
  }
  
  private loadPathGuard(path: ModulePath):
    Promise<ModuleLoadError | Null> | LoadingResultFn
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
  async loadProject(projectName: String): Promise<ProjectJsonError | Null> {
    if (this.projectMap.has(projectName)) return null;
    
    const projectJsonString = await this.moduleProvider.getProjectJson(projectName);
    
    if (projectJsonString instanceof projectJsonErrors) {
      return projectJsonString;
    }
    
    const projectJsonOrError = projectJsons.fromJson(projectJsonString);
    
    if (projectJsonOrError instanceof jsonValidationErrors) {
      return new projectJsonValidationErrors(projectName, projectJsonOrError);
    }
    
    const project = new projects(projectName, projectJsonOrError);
    
    this.projectMap.set(projectName, project);
    
    return null;
  }
  
  private async getPackageJsonString(packageId: PackageId):
    Promise<String | ModuleLoadError>
  {
    const phJsonString = await this.moduleProvider.getModuleSource(
      new modulePaths(packageId, [], 'package.hyloa.json'),
    );
    
    if (typeof phJsonString === 'string') {
      return phJsonString;
    }
    
    if (phJsonString instanceof otherModuleProviderErrors) {
      return phJsonString;
    }
    
    if (!(phJsonString instanceof moduleNotFoundErrors)) {
      exit('Programmer error - phJsonString has unknown type', phJsonString);
    }
    
    return this.moduleProvider.getModuleSource(
      new modulePaths(packageId, [], 'package.json'),
    );
  }
  
  private async loadPackageJson(projectJson: ProjectJson | Null, packageId: PackageId):
    Promise<PackageJson | ModuleLoadError | PackageJsonValidationError>
  {
    const packageJsonString = await this.getPackageJsonString(packageId);
    
    if (packageJsonString instanceof moduleLoadErrors) return packageJsonString;
    
    const packageJsonOrError = packageJsons.fromJson(projectJson, packageJsonString);
    
    if (packageJsonOrError instanceof jsonValidationErrors) {
      return new packageJsonValidationErrors(packageId, packageJsonOrError);
    }
    
    return packageJsonOrError;
  }
  
  /*/
    Does not load the modules of the package.
    Subsequent calls with the same package ID are a no-op.
  /*/
  async loadPackage(packageId: PackageId):
    Promise<Package | ModuleLoadError | PackageJsonValidationError>
  {
    if (packageId instanceof localPackageIds) {
      const project = this.projectMap.get(packageId.projectName);
      
      if (!project) exit('Programmer error -- called loadPackage on a non-loaded project.');
      
      const existingPackage = project.packages.get(packageId.packageName);
      
      if (existingPackage) return existingPackage;
      
      const packageJsonOrError =
        await this.loadPackageJson(project.projectJson, packageId);
      
      if (packageJsonOrError instanceof programErrors) return packageJsonOrError;
      
      const pkg = new packages(packageId, packageJsonOrError)
      
      project.packages.set(packageId.packageName, pkg);
      
      return pkg;
    }
    
    if (packageId instanceof publishedPackageIds) {
      const packageJsonOrError = await this.loadPackageJson(null, packageId);
      
      if (packageJsonOrError instanceof programErrors) return packageJsonOrError;
      
      const pkg = new packages(packageId, packageJsonOrError);
      
      this.installedPackageMap.set(packageId.toString(), pkg);
      
      return pkg;
    }
    
    exit('Programmer error -- unknown package id type.', packageId);
  }
  
  // Assumes the package is loaded.
  private async getModule(path: ModulePath, packageJson: PackageJson):
    Promise<Module | ModuleLoadTimeError[]>
  {
    const moduleSource = await this.moduleProvider.getModuleSource(path);
    
    if (moduleSource instanceof moduleLoadErrors) {
      return [ moduleSource ];
    }
    
    const parser = parserMap.get(path.extension()!)
    
    if (!parser) exit('Programmer error -- tried to load a file with an unsupported extension.', path);
    
    const moduleAst = parser.parse(moduleSource);
    
    if (!(moduleAst instanceof makeModuleAst)) {
      // TODO handle this better in hyloa. Probs move `ParseError` to the parser.
      // Also recover from recoverable parsing errors.
      return [ new parseErrors(path, 'unknown' as Any, moduleAst) ];
    }
    
    return new modules(moduleAst, path, packageJson);
  }
  
  // Assumes the package is already loaded.
  private addModule(path: ModulePath, module: Module): Void {
    if (path.packageId instanceof localPackageIds) {
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
  
  async loadPath(path: ModulePath, loadedFrom: ModulePath, loadedAt: SrcRange): Promise<ModuleLoadTimeError[]>
  async loadPath(path: ModulePath, loadedFrom: Null, loadedAt: Null): Promise<ModuleLoadTimeError[]>
  
  // If called multiple times, the subsequent calls will return an empty array.
  async loadPath(
    path: ModulePath,
    loadedFrom: ModulePath | Null,
    loadedAt: SrcRange | Null,
  ):
    Promise<ModuleLoadTimeError[]>
  {
    const guard = this.loadPathGuard(path);
    
    if (guard instanceof Promise) {
      const maybeError = await guard;
      
      if (maybeError && loadedFrom) {
        maybeError.importReferences.push([ loadedFrom, loadedAt! ]);
      }
      
      return [];
    }
    
    if (!isExtensionSupported(path.extension())) {
      const err = new unsupportedFileTypeErrors(path);
      
      guard(err);
      
      return [ err ];
    }
    
    const loadPackageError = await this.loadPackage(path.packageId)
    
    if (loadPackageError instanceof programErrors) {
      loadPackageError instanceof moduleLoadErrors
        ? guard(loadPackageError) : guard(null);
      
      return [ loadPackageError ];
    }
    
    const moduleOrErrors = await this.getModule(path, loadPackageError.packageJson);
    
    if (Array.isArray(moduleOrErrors)) {
      const moduleLoadError: ModuleLoadError | Null = moduleOrErrors
        // This is to placate TypeScript.
        .map(err => err instanceof moduleLoadErrors ? err : null)
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
  
  private async loadImports(module: Module) {
    const allErrors: ModuleLoadTimeError[][] = await Promise.all(
      module.imports.map(
        async (imported) => {
          const { importPosition } = imported.ast;
          const { importedPath } = imported;
          
          // TypeScript cannot handle a switch.
          if (importedPath === imports.missingDefaultRegistry) {
            return [
              new missingRegistryErrors(module.path, importPosition, imported.ast.parsedPath!),
            ];
          }
          
          if (importedPath === imports.runawayRelativePath) {
            return [
              new runawayRelativePathErrors(module.path, importPosition, imported.ast.path),
            ];
          }
          
          if (importedPath === imports.unknownDependency) {
            return [
              new unknownDependencyErrors(module.path, importPosition, imported.ast.parsedPath!),
            ];
          }
          
          if (importedPath === imports.unknownVersionAlias) {
            return [
              new unknownVersionAliasErrors(module.path, importPosition, imported.ast.parsedPath!.versionAlias),
            ];
          }
          
          return this.loadPath(importedPath, module.path, importPosition);
        },
      ),
    );
    
    return allErrors.flat();
  }
  
  validatePackage(
    _projectName: String,
    _packageName: String,
  ) {
    // TODO type checking and what not.
  }
  
  async compileProgram(
    projectName: String,
    packageName: String,
    _targetName: String,
    _outFolder: Folder,
  ) {
    await this.loadPackage(new localPackageIds(projectName, packageName));
    
    // TODO
    // target.compile(outFolder, this.program);
  }
  
  // TODO some api to interact with the code, eg. read variables,
  // call functions, debug them, modify the code, etc.
  // Also a parameterless emit overload that returns the exported
  // contents of the main module.
  
  // Args will by type-checked against the parameters of the `entrypoints` class
  async runProgram(
    _projectName: String,
    _programName: String,
    _options: RunProgramOptions = runProgramDefaultOptions,
    ..._args: unknown[]
  ) {
    // TODO
  }
}
