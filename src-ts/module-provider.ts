import { ModuleNotFound, ModuleLoadError, OtherModuleProviderError, MissingProjectJson, ProjectJsonModuleProviderError } from './languages/errors.js';
import { mainPath, ModulePathPackage, ModulePath } from './languages/module.js';
import { LocalPackageId } from './languages/package.js';
import { FileNotFoundError, FolderHandle, Path } from './utils/fs.js';


type MaybePromise<T> = T | Promise<T>;

/*/
  It must be able to load `package.json` even if aliases are
  still unknown.
  In Hyloa, perhaps make the returned errors generic?
/*/
export abstract class ModuleProvider {
  /*/
    Everything that has a modulePath is a module, and that
    includes `package.json`.
  /*/
  abstract getModuleSource(path: ModulePathPackage): MaybePromise<string | ModuleLoadError>
  
  abstract getProjectJson(projectName: string): MaybePromise<string | MissingProjectJson | ProjectJsonModuleProviderError>
}

export class FileSystemProvider implements ModuleProvider {
  constructor(
    public rootFolder: FolderHandle,
  ) {}
  
  async getModuleSource(modulePath: ModulePathPackage): Promise<string | ModuleLoadError> {
    const filePath = modulePath.toFsPath();
    const fileContent =  await this.rootFolder.readFile(filePath, 'utf8');
    
    if (typeof fileContent !== 'string') {
      return fileContent instanceof FileNotFoundError
        ? new ModuleNotFound(modulePath)
        : new OtherModuleProviderError(modulePath, fileContent);
    }
    
    return fileContent;
  }
  
  async getProjectJson(projectName: string): Promise<string | MissingProjectJson | ProjectJsonModuleProviderError> {
    const filePath = new Path([ 'projects', projectName ], 'project.json');
    const fileContent =  await this.rootFolder.readFile(filePath, 'utf8');
    
    if (typeof fileContent !== 'string') {
      return fileContent instanceof FileNotFoundError
        ? new MissingProjectJson(projectName)
        : new ProjectJsonModuleProviderError(projectName, fileContent);
    }
    
    return fileContent;
  }
}

/*/
  Serves modules from program's memory.
/*/
export class MemoryProvider implements ModuleProvider {
  static defaultPackageJson =
    '{ "dependencies": {}, "devDependencies": {}, "publishTo": {} }';
  
  static defaultProjectJson =
    '{ "registries": {}, "defaultRegistry": null }';
  
  private packageJsonPath = new ModulePath(this.packageId, [], 'package.json');
  
  // Map from module paths to modules.
  modules: Map<string, string>;
  
  constructor(
    public packageId: LocalPackageId,
    // If string, represents the main module.
    modules: string | Map<string, string>,
    public projectJson: string = MemoryProvider.defaultProjectJson,
  ) {
    this.modules = modules instanceof Map ? modules : new Map([
      [ mainPath(this.packageId).toString(), modules ],
      [ this.packageJsonPath.toString(), MemoryProvider.defaultPackageJson ],
    ]);
  }
  
  getModuleSource(path: ModulePathPackage): string | ModuleNotFound {
    return this.modules.get(path.toString()) ?? new ModuleNotFound(path);
  }
  
  getProjectJson(projectName: string): string | MissingProjectJson | ProjectJsonModuleProviderError {
    if (projectName === this.packageId.projectName) {
      return this.projectJson;
    }
    
    return new MissingProjectJson(projectName);
  }
}
