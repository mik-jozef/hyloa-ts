import { Target } from '../compile-targets/targets.js';
import { Path } from '../utils/fs.js';
import { JsonValidationError } from '../utils/json-validation-error.js';
import { Import } from './import.js';
import { Module } from './module.js';
import { ProjectJson } from './project.js';


export class Version {
  constructor(version: string);
  constructor(major: string, minor: string, patch: string);
  
  constructor(
    /*/
      If minor and patch are not provided, this is expected to contain
      the whole version (d.d.d).
    /*/
    public major: string,
    public minor?: string,
    public patch?: string,
  ) {
    if (minor === undefined) {
      const versionParts = major.split('.');
      
      if (versionParts.length !== 3) {
        throw new Error('Programmer error -- version must be d.d.d');
      }
      
      [ this.major, this.minor, this.patch ] =
        versionParts as [ string, string, string ];
    }
  }
  
  toString() {
    return [ this.major, this.minor, this.patch ].join('.')
  }
  
  equals(v: Version) {
    return this.toString() === v.toString();
  }
}

export type PackageDependency = Map<string, Version>;

export class VersionAliases {
  // A map from a version alias (kebab-case) to a version.
  map: Map<string, Version>;
  
  constructor(
    dependencies: PackageDependency,
  ) {
    this.map = dependencies;
  }
  
  resolve(alias: string): Version | null {
    return this.map.get(alias) || null;
  }
}

export class PublishTo {
  constructor(
    public registry: string,
    public scope: string | null,
    public name: string,
    public asPrivate: boolean,
  ) {}
}

export abstract class PackageId {
  abstract toFsPath(folderArr: string[], file: string | null): Path;
  
  abstract equals(id: PackageId): boolean;
}

/*/
  Local package IDs uniquely represent unpublished packages
  in projects. These cannot be imported (but published packages
  can be [linked](TODO) to a local package).
  
  Stringified as `project-name/package-name`.
/*/
export class LocalPackageId extends PackageId {
  constructor(
    public projectName: string,
    public packageName: string,
  ) { super(); }
  
  toString() {
    return this.projectName + '/' + this.packageName;
  }
  
  toFsPath(folderArr: string[], file: string | null): Path {
    const fsFolderArr = [
      'projects',
      this.projectName,
      this.packageName,
      ...folderArr
    ];
    
    return new Path(fsFolderArr, file === null ? '.hyloa' : file);
  }
  
  equals(id: PackageId) {
    if (!(id instanceof LocalPackageId)) return false;
    
    return this.projectName === id.projectName
      && this.packageName === id.packageName;
  }
}

/*/
  Published package IDs uniquely identify packages published
  to a registry.
  
  Stringified as `registry scope:name#version` or
  `registry name#version`, depending on whether the package
  is scoped. (The space has to be a signle ASCII space char.)
/*/
export class PublishedPackageId extends PackageId {
  constructor(
    // One of the registries defined in `project.json`.
    public registry: string,
    public scope: string | null,
    public name: string,
    public version: Version,
  ) { super(); }
  
  toString() {
    return this.registry
      + ' ' + (this.scope ? this.scope + ':' : '')
      + this.name
      + '#' + this.version
    ;
  }
  
  toFsPath(folderArr: string[], file: string | null): Path {
    const fsFolderArr = [
      'lib',
      this.registry,
      this.scope ?? '-unscoped-',
      this.name,
      this.version.toString(),
      ...folderArr,
    ];
    
    return new Path(fsFolderArr, file === null ? '.hyloa' : file);
  }
  
  equals(id: PackageId) {
    if (!(id instanceof PublishedPackageId)) return false;
    
    return this.registry === id.registry
      && this.scope === id.scope
      && this.name === id.name
      && this.version.equals(id.version)
    ;
  }
}

/*/
  A reprezentation of `package-settings.json.`
  
  // TODO make sure that in the entire project,
  // the KebabCase type ([a-z][a-z0-9\-]+[a-z0-9])
  // is used where appropriate.
  
  The schema of the file:
  
  ```
    Version = string
    Dependency = Version | Record<KebabCase, Version> // Version represents { default: Version }
    PublishTo = {
      registry: string, // One of the registries defined in `project.json`.
      scope: KebabCase | null,
      name: KebabCase,
      isPrivate: boolean,
    }
    
    // An alias for a (kebabcased, subdomains allowed) domain
    // without protocol or port (eg. `pkg.my-registry.com`).
    RegistryUrl = string
    
    PackageSettings = {
      defaultRegistry: KebabCase | null,
      registries: Record<KebabCase, RegistryUrl>,
      
      // In case this is a record, the publishing command should
      // require the name of the registry.
      publishTo: KebabCase | null | Record<KebabCase, PublishTo>,
      
      targets: Record<KebabCase, Target>,
      
      dependencies: Record<PublishedPackage.Id, Dependency>,
      devDependencies: Record<PublishedPackage.Id, Dependency>,
    }
  ```
/*/
export class PackageJson {
  defaultRegistry: string | null = null;
  registries = new Map<string, string>();
  
  publishTo = new Map<string, PublishTo>();
  
  targets = new Map<string, Target>();
  
  dependencies = new Map<string, PackageDependency>(); // TODO when importing from json, don't forget to convert to `{ default: ... }`
  devDependencies = new Map<string, PackageDependency>();
  
  constructor(
    public projectJson: ProjectJson | null,
    args: unknown, // TODO a package.json-schema-satisfying object.
  ) {
    Object.assign(this, args);
  }
  
  getDefaultRegistryUrl(): string | null {
    return this.defaultRegistry ?? this.projectJson?.defaultRegistry ?? null;
  }
  
  resolveRef(
    registry: string | null,
    scope: string | null,
    name: string,
    versionAlias: string,
    
  ):
    | PublishedPackageId
    | typeof Import.missingDefaultRegistry
    | typeof Import.unknownDependency
    | typeof Import.unknownVersionAlias
  {
    if (registry === null) {
      registry = this.getDefaultRegistryUrl();
      
      if (registry === null) return Import.missingDefaultRegistry;
    }
    
    const packageId = `${registry} ${scope ? scope + ':' : ''}${name}`;
    
    // Dev dependencies cannot be imported by the program's source code.
    const packageJson = this.dependencies.get(packageId);
    
    if (!packageJson) return Import.unknownDependency;
    
    const version = packageJson.get(versionAlias)
    
    if (!version) return Import.unknownVersionAlias;
    
    return new PublishedPackageId(registry, scope, name, version);
  }
  
  static fromJson(projectJson: ProjectJson | null, json: string):
    PackageJson | JsonValidationError<never>
  {
    const parsed = JSON.parse(json);
    
    return new PackageJson(projectJson, {
      defaultRegistry: parsed.defaultRegistry,
      registries: new Map(Object.entries(parsed.registries)),
      publishTo: 'TODO',
      targets: 'TODO',
      dependencies: 'TODO',
      devDependencies: 'TODO',
    });
  }
}

/*/
  Package name of a local package is determined by the folder
  it is in (kebab-case).
  
  Package registries are specified in `project.json`.
  
  Package reference is a string that can be used when importing
  the package. It is like package ID, except:
  0. The version is replaced by an alias for the version (aliases
     come from package settings), or might be omitted, in which
     case the alias equals "default",
  1. The registry may be omitted, in that case it implicitly
     equals the default registry (which is set by project
     settings).
  A reference with an omitted registry or alias is said to be
  partial, else it is full.
/*/
export class Package<Pid extends PackageId> {
  // Uses strings instead of ModulePaths to avoid duplicates.
  modules = new Map<string, Module>();
  
  constructor(
    public id: Pid,
    public packageJson: PackageJson,
  ) {}
  
  isPublished(): boolean {
    return this.id instanceof PublishedPackageId;
  }
  
  addModule(module: Module) {
    this.modules.set(module.path.toString(), module);
  }
}

export type LocalPackage = Package<LocalPackageId>;
export type PublishedPackage = Package<PublishedPackageId>;
export type PackageAny = Package<PackageId>;
