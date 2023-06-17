import { ModuleNotFound, ModuleLoadError, OtherModuleProviderError, MissingProjectJson, ProjectJsonModuleProviderError } from './languages/errors.js';
import { mainPath, ModulePathPackage, ModulePath } from './languages/module.js';
import { LocalPackageId } from './languages/package.js';
import { FileNotFoundError, Folder, Path } from './utils/fs.js';


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
    public rootFolder: Folder,
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
  Only serves `project.json`, `package.json` and the main path
  of a single package.
/*/
export class SingleModuleProvider implements ModuleProvider {
  static defaultPackageJson =
    '{ dependencies: {}, devDependencies: {}, publishTo: {} }';
  
  static defaultProjectJson =
    '{ registries: {}, defaultRegistry: null }';
  
  constructor(
    public packageId: LocalPackageId,
    public moduleContent: string,
    public projectJson: string = SingleModuleProvider.defaultProjectJson,
    public packageJson: string = SingleModuleProvider.defaultPackageJson,
  ) {}
  
  getModuleSource(path: ModulePathPackage): string | ModuleNotFound {
    /*/
      `package.hyloa.json` is only supported by file system
      providers, to avoid a potential conflict with npm's
      `package.json`.
    /*/
    if (path.equals(new ModulePath(this.packageId, [], 'package.json'))) {
      return this.packageJson;
    }
    
    return path.equals(mainPath(this.packageId))
      ? this.moduleContent
      : new ModuleNotFound(path);
  }
  
  getProjectJson(projectName: string): string | MissingProjectJson | ProjectJsonModuleProviderError {
    if (projectName === this.packageId.projectName) {
      return this.packageJson
    }
    
    return new MissingProjectJson(projectName);
  }
}
