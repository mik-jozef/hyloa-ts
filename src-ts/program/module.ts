import * as ToCase from 'case';

import { ModuleAst } from '../syntax-tree/module-ast.js';
import { Path } from '../utils/fs.js';
import { Import } from './import.js';
import { PackageAliases } from './package-settings.js';


/*/
  Paths are stored in PascalCase. The corresponding filesystem entries must
  be in snake-case.
/*/
export class ModulePath {
  constructor(
    // Stored without the @ sign.
    public alias: string | null,
    public folders: string[],
    public file: string | null,
  ) {}
  
  toString(): string {
    return (
      (this.alias === null ? '/' : '@' + this.alias + '/')
      + this.folders.map(folder => ToCase.kebab(folder) + '/')
      + (this.file ? ToCase.kebab(this.file) : '-') + '.hyloa'
    );
  }
  
  // Returns null if there is an unknown alias.
  toFsPath(aliases: PackageAliases | null): Path | null {
    const aliasFolders: string[] | null = this.alias === null
      ? [] : aliases ? aliases.resolve(this.alias) : null;
    const mappedFolders = this.folders.map(folder => ToCase.kebab(folder) + '/');
    
    if (aliasFolders === null) return null;
    
    return new Path(
      [ ...aliasFolders, ...mappedFolders ],
      (this.file ? ToCase.kebab(this.file) : '-') + '.hyloa',
    );
  }
  
  equals(p: ModulePath): boolean {
    return this.alias === p.alias
      && this.folders.every((folder, i) => p.folders[i] === folder)
      && this.file === p.file;
  }
  
  copy(): ModulePath {
    return new ModulePath(this.alias, [ ...this.folders ], this.file);
  }
  
  private resolveRelativeImport(importedPath: string): ModulePath | null {
    const importedPathArr = importedPath.split('/');
    const folders = [ ...this.folders ];
    
    while ([ '..', '.' ].includes(importedPathArr[0])) {
      if (importedPathArr[0] === '..') {
        if (folders.length === 0) return null;
        
        folders.pop();
      }
      
      importedPathArr.shift();
    }
    
    /*/
      The array cannot be empty, because a relative path consisting of only
      ups (`../`) must end with a slash. It can, however, contain the empty
      string, which must be mapped to null.
    /*/
    const file = importedPathArr.pop() || null;
    
    return new ModulePath(this.alias, [ ...folders, ...importedPathArr ], file);
  }
  
  // Returns null if importedPath is a relative path that escapes the root.
  resolveImport(importedPath: string): ModulePath | null {
    if (importedPath === '') throw new Error('Empty path.');
    if (![ '@', '.', '/' ].includes(importedPath[0])) {
      throw new Error('Path must start with one of "@./": ' + importedPath);
    }
    
    if (importedPath[0] === '.') return this.resolveRelativeImport(importedPath);
    
    const importedPathArr = importedPath.split('/');
    const alias = importedPath[0] === '@' ? importedPathArr[0].substring(1) : this.alias;
    const [ , ...folders ] = importedPathArr;
    
    if (folders.length === 0) return new ModulePath(alias, folders, null);
    
    const file = folders.pop() || null;
    
    return new ModulePath(alias, folders, file);
  }
}

export const mainPath = new ModulePath(null, [], null);


export class Module {
  imports: Import[];
  
  constructor(
    public ast: ModuleAst,
    public path: ModulePath,
  ) {
    this.imports = ast.imports.map(impr => new Import(impr, path))
  }
}
