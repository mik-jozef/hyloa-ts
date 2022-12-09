// @ts-ignore
type String = string; type Null = null; type Boolean = boolean; type Number = number; type BigInt = bigint; type Symbol = symbol; type Unknown = unknown; type Never = never; type Any = any; type Void = void

import { SyntaxTreeNode as syntaxTreeNodes } from "lr-parser-typescript";
import { SrcRange } from "./errors.js";
import { ModulePath, modulePaths, ParsedPath } from "./modules.js";
import { PackageJson } from "./packages.js";


type ImportedPath =
  | ModulePath
  | MissingDefaultRegistry
  | RunawayRelativePath
  | UnknownDependency
  | UnknownVersionAlias
;

// These declarations are only here bc TypeScript does not infer
// the type right otherwise.
const missingDefaultRegistry = Symbol('missing default registry');
type MissingDefaultRegistry = typeof missingDefaultRegistry;

const runawayRelativePath = Symbol('runaway relative path');
type RunawayRelativePath = typeof runawayRelativePath;

const unknownDependency = Symbol('unknown dependency');
type UnknownDependency = typeof unknownDependency;

const unknownVersionAlias = Symbol('unknown version alias');
type UnknownVersionAlias = typeof unknownVersionAlias;


export type ImportAst = importAsts;
export abstract class importAsts extends syntaxTreeNodes {
  abstract path: String;
  abstract parsedPath: ParsedPath | Null;
  
  /*/
    This serves as a temporary anchor for potential errors.
    
    TODO replace with specific error positions for specific
    error types.
  /*/
  abstract importPosition: SrcRange;
  
  abstract isExternalImport(): this is ExternalImportAst;
}

export type ExternalImportAst = ImportAst & { parsedPath: ParsedPath };


export type Import = imports;
export class imports {
  static missingDefaultRegistry: MissingDefaultRegistry = missingDefaultRegistry;
  static runawayRelativePath: RunawayRelativePath = runawayRelativePath;
  static unknownDependency: UnknownDependency = unknownDependency;
  static unknownVersionAlias: UnknownVersionAlias = unknownVersionAlias;
  
  public importedPath: ImportedPath;
  
  constructor(
    public ast: ImportAst,
    importingPath: ModulePath,
    packageJson: PackageJson, // Of the importing package.
  ) {
    if (ast.isExternalImport()) {
      this.importedPath = this.resolveExternalImport(ast, packageJson);
    } else {
      this.importedPath = this.resolveLocalImport(importingPath, ast.path);
    }
  }
  
  private resolveLocalImport(
    importingPath: ModulePath,
    importedPath: String,
  ): ImportedPath {
    if (importedPath[0] === '/') return new modulePaths(importingPath.packageId, importedPath);
    
    const importingFolders = [ ...importingPath.folderArr ];
    
    for (const fsEntry of importedPath.split('/')) {
      if (fsEntry === '.') continue;
      if (fsEntry === '..') {
        if (importingFolders.length === 0) return imports.runawayRelativePath;
        
        importingFolders.pop();
        
        continue;
      }
      
      importingFolders.push(fsEntry);
    }
    
    const path = importingFolders.map(f => '/' + f).join('');
    
    return new modulePaths(importingPath.packageId, path);
  }
  
  private resolveExternalImport(ast: ExternalImportAst, packageJson: PackageJson): ImportedPath {
    const packageId = packageJson.resolveRef(
      ast.parsedPath.registry,
      ast.parsedPath.scope,
      ast.parsedPath.name,
      ast.parsedPath.versionAlias,
    );
    
    if (typeof packageId === 'symbol') return packageId;
    
    return new modulePaths(packageId, ast.parsedPath.rest);
  }
}