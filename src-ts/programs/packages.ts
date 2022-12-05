// @ts-ignore
type String = string; type Null = null; type Boolean = boolean; type Number = number; type BigInt = bigint; type Symbol = symbol; type Unknown = unknown; type Never = never; type Any = any; type Void = void

import { Target } from '../compile-targets/targets.js';
import { Path, paths } from '../utils/fs.js';
import { JsonValidationError } from '../utils/validationErrors.js';
import { imports } from './imports.js';
import { Module } from './modules.js';
import { ProjectJson } from './projects.js';


export type Version = versions;
export class versions {
  constructor(version: String);
  constructor(major: String, minor: String, patch: String);
  
  constructor(
    public major: String,
    public minor?: String,
    public patch?: String,
  ) {
    if (minor === undefined) {
      [ this.major, this.minor, this.patch ] = major.split('.');
    }
  }
  
  toString() {
    return [ this.major, this.minor, this.patch ].join('.')
  }
  
  equals(v: Version) {
    return this.toString() === v.toString();
  }
}

export type PackageDependency = Map<String, Version>;

export type VersionAliases = versionAliasCollections;
export class versionAliasCollections {
  // A map from a version alias (kebab-case) to a version.
  map: Map<String, Version>;
  
  constructor(
    dependencies: PackageDependency,
  ) {
    this.map = dependencies;
  }
  
  resolve(alias: String): Version | Null {
    return this.map.get(alias) || null;
  }
}

export type PublishTo = publishTos;
export class publishTos {
  constructor(
    public registry: String,
    public scope: String | null,
    public name: String,
    public asPrivate: Boolean,
  ) {}
}

export type PackageId = packageIds;
export abstract class packageIds {
  abstract toFsPath(folderArr: String[], file: String | Null): Path;
  
  abstract equals(id: PackageId): Boolean;
}

/*/
  Local package IDs uniquely represent unpublished packages
  in projects. These cannot be imported (but published packages
  can be [linked](TODO) to a local package).
  
  Stringified as `project-name/package-name`.
/*/
export type LocalPackageId = localPackageIds;
export class localPackageIds extends packageIds {
  constructor(
    public projectName: String,
    public packageName: String,
  ) { super(); }
  
  toString() {
    return this.projectName + '/' + this.packageName;
  }
  
  toFsPath(folderArr: String[], file: String | null): Path {
    const fsFolderArr = [
      'projects',
      this.projectName,
      this.packageName,
      ...folderArr
    ];
    
    return new paths(fsFolderArr, file === null ? '.hyloa' : file);
  }
  
  equals(id: PackageId) {
    if (!(id instanceof localPackageIds)) return false;
    
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
export type PublishedPackageId = publishedPackageIds;
export class publishedPackageIds extends packageIds {
  constructor(
    // One of the registries defined in `project.json`.
    public registry: String,
    public scope: String | Null,
    public name: String,
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
    
    return new paths(fsFolderArr, file === null ? '.hyloa' : file);
  }
  
  equals(id: PackageId) {
    if (!(id instanceof publishedPackageIds)) return false;
    
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
    Version = String
    Dependency = Version | Record<KebabCase, Version> // Version represents { default: Version }
    PublishTo = {
      registry: String, // One of the registries defined in `project.json`.
      scope: KebabCase | Null,
      name: KebabCase,
      isPrivate: Boolean,
    }
    
    // An alias for a (kebabcased, subdomains allowed) domain
    // without protocol or port (eg. `pkg.my-registry.com`).
    Registry = String
    
    PackageSettings = {
      defaultRegistry: KebabCase | Null,
      registries: Record<KebabCase | '', Registry>, // TODO make sure all registries are unique
      
      // In case this is a record, the publishing command should
      // require the name of the registry.
      publishTo: Record<KebabCase, PublishTo>,
      
      targets: Record<KebabCase, Target>,
      
      dependencies: Record<PublishedPackage.Id, Dependency>,
      devDependencies: Record<PublishedPackage.Id, Dependency>,
    }
  ```
  
  Note the file MUST NOT contain the package version.
  Let's uphold the single source of truth principle here.
  The version field does not belong here.
/*/
export type PackageJson = packageJsons;
export class packageJsons { // TODO replace plurals with `make[TypeName]`
  defaultRegistry: String | Null = null;
  registries = new Map<String, String>();
  
  publishTo = new Map<String, PublishTo>();
  
  targets = new Map<String, Target>();
  
  dependencies = new Map<String, PackageDependency>(); // TODO when importing from json, don't forget to convert to `{ default: ... }`
  devDependencies = new Map<String, PackageDependency>();
  
  constructor(
    public projectJson: ProjectJson | Null,
    args: Unknown, // TODO a package.json-schema-satisfying object.
  ) {
    Object.assign(this, args);
  }
  
  getDefaultRegistryUrl(): String | Null {
    return this.defaultRegistry ?? this.projectJson?.defaultRegistry ?? null;
  }
  
  resolveRef(
    registry: String | Null,
    scope: String | Null,
    name: String,
    versionAlias: String,
    
  ):
    | PublishedPackageId
    | typeof imports.missingDefaultRegistry
    | typeof imports.unknownDependency
    | typeof imports.unknownVersionAlias
  {
    if (registry === null) {
      registry = this.getDefaultRegistryUrl();
      
      if (registry === null) return imports.missingDefaultRegistry;
    }
    
    const packageId = `${registry} ${scope ? scope + ':' : ''}${name}`;
    
    // Dev dependencies cannot be imported by the program's source code.
    const packageJson = this.dependencies.get(packageId);
    
    if (!packageJson) return imports.unknownDependency;
    
    const version = packageJson.get(versionAlias)
    
    if (!version) return imports.unknownVersionAlias;
    
    return new publishedPackageIds(registry, scope, name, version);
  }
  
  static fromJson(projectJson: ProjectJson | null, json: String):
    PackageJson | JsonValidationError<never>
  {
    const parsed = JSON.parse(json);
    
    return new packageJsons(projectJson, {
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
export type Package = PackageT<PackageId>;
export type PackageT<Pid extends PackageId> = packages<Pid>;
export class packages<Pid extends PackageId> {
  // Uses strings instead of ModulePaths to avoid duplicates.
  modules = new Map<String, Module>();
  
  constructor(
    public id: Pid,
    public packageJson: PackageJson,
  ) {}
  
  isPublished(): Boolean {
    return this.id instanceof publishedPackageIds;
  }
  
  addModule(module: Module) {
    this.modules.set(module.path.toString(), module);
  }
}

export type LocalPackage = PackageT<LocalPackageId>;
export type PublishedPackage = PackageT<PublishedPackageId>;
