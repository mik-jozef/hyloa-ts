import { mainPath, ModulePath } from './program/modules.js';
import { PackageAliases } from './program/packages.js';
import { fuckThrow } from './utils/exit.js';
import { folders } from './utils/fs.js';


type ModuleSourceRet = NodeJS.ErrnoException | string | null;

// It must be able to load package settings even if aliases are still unknown.
export type ModuleProvider = moduleProviders;
export abstract class moduleProviders {
  abstract setAliases(packageId: string, aliases: PackageAliases): moduleProviders
  
  // Returns null if the path contains an unrecognized alias.
  abstract getModuleSource(packageId: string, path: ModulePath):
    ModuleSourceRet | Promise<ModuleSourceRet>
}

export class fileSystemProviders implements moduleProviders {
  aliases = new Map<string, PackageAliases>();
  
  constructor(
    public rootFolder: folders,
  ) {}
  
  setAliases(packageId: string, aliases: PackageAliases): fileSystemProviders {
    this.aliases.set(packageId, aliases);
    
    return this;
  }
  
  async getModuleSource(
    packageId: string,
    path: ModulePath,
  ):
    Promise<NodeJS.ErrnoException | string | null>
  {
    const filePath = path.toFsPath(this.aliases.get(packageId) || null);
    
    if (filePath === null) return null;
    
    const fileContent =
      await fuckThrow(() => this.rootFolder.readFile(filePath, 'utf8'))
    
    if (typeof fileContent !== 'string') {
      if(fileContent.code === 'ENOENT') return fileContent;
      
      throw fileContent;
    }
    
    return fileContent;
  }
}

export type SingleModuleProvider = singleModuleProviders;
export class singleModuleProviders implements moduleProviders {
  constructor(
    public moduleContent: string,
  ) {}
  
  setAliases(): SingleModuleProvider { return this; }
  
  // TODO provide default package.json.
  getModuleSource(_packageId: string, path: ModulePath) {
    return path.equals(mainPath) ? this.moduleContent : null;
  }
}
