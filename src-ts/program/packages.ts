import { Module } from "./modules";


export type PackageAliases = packageAliasCollections;
export class packageAliasCollections {
  /*/
    A map from an alias to an array of folders.
    An alias cannot link to an otherwise reachable path.
    A local package 'foo' is resolved to `[ 'foo' ]`.
    A library 'foo' is resolved to `[ 'local', 'lib', 'foo', '1.0.8' ]`. TODO
  /*/
  map = new Map<string, string[]>()
  
  resolve(alias: string): string[] | null {
    return this.map.get(alias) || null;
  }
}

export type PackageSettings = packageSettingObjects;
export class packageSettingObjects {
  aliases = new packageAliasCollections();
}

export type Package = packages;
export class packages {
  // Uses strings instead of ModulePaths to avoid duplicates.
  modules = new Map<string, Module>()
  
  constructor(
    public name: string, // Determined by the folder name if local.
    public registry: string | null, // Null if local.
    public settings: PackageSettings,
  ) {}
  
  isLocal(): boolean { return this.registry === null; }
  
  getId() {
    return this.registry === null
      ? this.name
      : this.registry + '::' + this.name;
  }
  
  addModule(module: Module) {
    this.modules.set(module.path.toString(), module);
  }
}