import { mainPath, ModulePath } from './program/module.js';
import { PackageAliases } from './program/package-settings.js';
import { fuckThrow } from './utils/exit.js';
import { Folder } from './utils/fs.js';


type ModuleSourceRet = NodeJS.ErrnoException | string | null;

// It must be able to load package settings even if aliases are still unknown.
export abstract class ModuleProvider {
  // Returns null if the path contains an unrecognized alias.
  abstract getModuleSource(path: ModulePath): ModuleSourceRet | Promise<ModuleSourceRet>
  
  abstract setAliases(aliases: PackageAliases): ModuleProvider
}

export class FileSystemProvider implements ModuleProvider {
  aliases: PackageAliases | null = null
  
  constructor(
    public rootFolder: Folder,
  ) {}
  
  setAliases(aliases: PackageAliases): FileSystemProvider {
    this.aliases = aliases;
    
    return this;
  }
  
  async getModuleSource(path: ModulePath): Promise<NodeJS.ErrnoException | string | null> {
    const filePath = path.toFsPath(this.aliases);
    
    if (filePath === null) return null;
    
    const fileContents =
      await fuckThrow(() => this.rootFolder.readFile(filePath, 'utf8'))
    
    if (typeof fileContents !== 'string') {
      if(fileContents.code === 'ENOENT') return fileContents;
      
      throw fileContents;
    }
    
    return fileContents;
  }
}

export class SingleModuleProvider implements ModuleProvider {
  constructor(
    public moduleContent: string,
  ) {}
  
  setAliases(): SingleModuleProvider { return this; }
  
  // TODO provide default package settings.
  getModuleSource(path: ModulePath) {
    return path.equals(mainPath) ? this.moduleContent : null;
  }
}