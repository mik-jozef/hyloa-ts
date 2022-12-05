// @ts-ignore
type String = string; type Null = null; type Boolean = boolean; type Number = number; type BigInt = bigint; type Symbol = symbol; type Unknown = unknown; type Never = never; type Any = any; type Void = void

import { modulesAst } from '../syntax-trees/modules-ast.js';
import { exit } from '../utils/exit.js';
import { Path } from '../utils/fs.js';
import { Import, imports } from './imports.js';
import { LocalPackageId, PackageId, PackageJson, PublishedPackageId } from './packages.js';


export type LocalModulePath = ModulePathT<LocalPackageId>
export type PublishedModulePath = ModulePathT<PublishedPackageId>
export type ModulePath = ModulePathT<PackageId>;

/*/
  A ModulePath uniquely identifies a module (local or library)
  in a workspace. Paths must be in snake-case.
  
  A file must have an extension, a folder must not.
  
  A path can either be local (`project-name/package-name/foo/bar.hyloa`),
  or qualified (`[package-id]/foo/bar.js`), depending on the
  package ID.
/*/
export type ModulePathT<Pid extends PackageId> = modulePaths<Pid>;
export class modulePaths<Pid extends PackageId> {
  folderArr: String[];
  file: String | Null;
  
  constructor(packageId: Pid, path: String); // Path is expected to start with a slash.
  constructor(packageId: Pid, folderArr: String[], file: String | Null);
  
  constructor(
    public packageId: Pid,
    folderArr: String[] | String,
    file?: String | Null,
  ) {
    if (Array.isArray(folderArr)) {
      this.folderArr = folderArr;
      this.file = file!;
    } else {
      const [ empty, ...pathParts ] = folderArr.split('/');
      
      if (empty !== '') exit('Programmer error -- path must start with a slash.');
      
      if (pathParts.length === 0) {
        this.folderArr = pathParts;
        this.file = null;
      } else {
        this.folderArr = pathParts;
        
        this.file = pathParts[pathParts.length - 1].includes('.')
          ? pathParts.pop()! : null;
      }
    }
  }
  
  toString(): String {
    return this.packageId.toString() + '/'
      + this.folderArr.map(folder => folder + '/').join()
      + (this.file ? this.file : '') + '.hyloa';
  }
  
  // The returned path assumes the workspace is the root folder.
  toFsPath(): Path {
    return this.packageId.toFsPath(this.folderArr, this.file);
  }
  
  // Returns true iff `this` and `p` represent the same module.
  equals(p: ModulePath): boolean {
    return this.packageId.equals(p.packageId)
      && this.folderArr.every((folder, i) => p.folderArr[i] === folder)
      && this.file === p.file;
  }
  
  copy(): ModulePath {
    return new modulePaths(this.packageId, [ ...this.folderArr ], this.file);
  }
}

export function mainPath(packageId: PackageId) {
  return new modulePaths(packageId, [], null);
}


export type Module = modules;
export class modules {
  imports: Import[];
  
  constructor(
    public ast: modulesAst,
    public path: ModulePath,
    packageJson: PackageJson,
  ) {
    this.imports = ast.imports.map(impr => new imports(impr, path, packageJson))
  }
}
