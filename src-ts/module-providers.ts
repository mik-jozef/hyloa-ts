// @ts-ignore
type String = string; type Null = null; type Boolean = boolean; type Number = number; type BigInt = bigint; type Symbol = symbol; type Unknown = unknown; type Never = never; type Any = any; type Void = void

import { moduleNotFoundErrors, ModuleLoadError, otherModuleProviderErrors, missingProjectJsonErrors, MissingProjectJson, ProjectJsonModuleProviderError, projectJsonModuleProviderErrors, ModuleNotFound } from './languages/errors.js';
import { mainPath, ModulePath, modulePaths } from './languages/modules.js';
import { PackageId } from './languages/packages.js';
import { fileNotFoundErrors, Folder, paths } from './utils/fs.js';


type MaybePromise<T> = T | Promise<T>;

/*/
  It must be able to load `package.json` even if aliases are
  still unknown.
  In Hyloa, perhaps make the returned errors generic?
/*/
export type ModuleProvider = moduleProviders;
export abstract class moduleProviders {
  /*/
    Everything that has a modulePath is a module, and that
    includes `package.json`.
  /*/
  abstract getModuleSource(path: ModulePath): MaybePromise<String | ModuleLoadError>
  
  abstract getProjectJson(projectName: String): MaybePromise<String | MissingProjectJson | ProjectJsonModuleProviderError>
}

export type FileSystemProvider = fileSystemProviders;
export class fileSystemProviders implements moduleProviders {
  constructor(
    public rootFolder: Folder,
  ) {}
  
  async getModuleSource(modulePath: ModulePath): Promise<String | ModuleLoadError> {
    const filePath = modulePath.toFsPath();
    const fileContent =  await this.rootFolder.readFile(filePath, 'utf8');
    
    if (typeof fileContent !== 'string') {
      return fileContent instanceof fileNotFoundErrors
        ? new moduleNotFoundErrors(modulePath)
        : new otherModuleProviderErrors(modulePath, fileContent);
    }
    
    return fileContent;
  }
  
  async getProjectJson(projectName: string): Promise<String | MissingProjectJson | ProjectJsonModuleProviderError> {
    const filePath = new paths([ 'projects', projectName ], 'project.json');
    const fileContent =  await this.rootFolder.readFile(filePath, 'utf8');
    
    if (typeof fileContent !== 'string') {
      return fileContent instanceof fileNotFoundErrors
        ? new missingProjectJsonErrors(projectName)
        : new projectJsonModuleProviderErrors(projectName, fileContent);
    }
    
    return fileContent;
  }
}

/*/
  Only serves `project.json`, `package.json` and the main path
  of a single package.
/*/
export type SingleModuleProvider = singleModuleProviders;
export class singleModuleProviders implements moduleProviders {
  static defaultPackageJson =
    '{ dependencies: {}, devDependencies: {}, publishTo: {} }';
  
  static defaultProjectJson =
    '{ programs: {}, registries: {}, defaultRegistry: null }';
  
  constructor(
    public projectName: String,
    public packageId: PackageId,
    public moduleContent: String,
    public projectJson: String = singleModuleProviders.defaultProjectJson,
    public packageJson: String = singleModuleProviders.defaultPackageJson,
  ) {}
  
  getModuleSource(path: ModulePath): String | ModuleNotFound {
    /*/
      `package.hyloa.json` is only supported by file system
      providers, to avoid a potential conflict with npm's
      `package.json`.
    /*/
    if (path.equals(new modulePaths(this.packageId, [], 'package.json'))) {
      return this.packageJson;
    }
    
    return path.equals(mainPath(this.packageId))
      ? this.moduleContent
      : new moduleNotFoundErrors(path);
  }
  
  getProjectJson(projectName: string): String | MissingProjectJson | ProjectJsonModuleProviderError {
    if (projectName === this.projectName) {
      return this.packageJson
    }
    
    return new missingProjectJsonErrors(projectName);
  }
}
