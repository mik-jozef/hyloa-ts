import { SyntaxTreeNode } from "lr-parser-typescript";
import { SrcRange } from "./errors.js";
import { ModulePathAny, ModulePath, ParsedPath } from "./module.js";
import { PackageJson } from "./package.js";


type ImportedPath =
  | ModulePathAny
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


export abstract class ImportAst extends SyntaxTreeNode {
  abstract path: string;
  abstract parsedPath: ParsedPath | null;
  
  /*/
    This serves as a temporary anchor for potential errors.
    
    TODO replace with specific error positions for specific
    error types.
  /*/
  abstract importKeyword: SrcRange;
  
  abstract isExternalImport(): this is ExternalImportAst;
}

export type ExternalImportAst = ImportAst & { parsedPath: ParsedPath };


export class Import {
  static missingDefaultRegistry: MissingDefaultRegistry = missingDefaultRegistry;
  static runawayRelativePath: RunawayRelativePath = runawayRelativePath;
  static unknownDependency: UnknownDependency = unknownDependency;
  static unknownVersionAlias: UnknownVersionAlias = unknownVersionAlias;
  
  public importedPath: ImportedPath;
  
  constructor(
    public ast: ImportAst,
    importingPath: ModulePathAny,
    packageJson: PackageJson, // Of the importing package.
  ) {
    if (ast.isExternalImport()) {
      this.importedPath = this.resolveExternalImport(ast, packageJson);
    } else {
      this.importedPath = this.resolveLocalImport(importingPath, ast.path);
    }
  }
  
  private resolveLocalImport(
    importingPath: ModulePathAny,
    importedPath: string,
  ): ImportedPath {
    if (importedPath[0] === '/') return new ModulePath(importingPath.packageId, importedPath);
    
    const importingFolders = [ ...importingPath.folderArr ];
    
    for (const fsEntry of importedPath.split('/')) {
      if (fsEntry === '.') continue;
      if (fsEntry === '..') {
        if (importingFolders.length === 0) return Import.runawayRelativePath;
        
        importingFolders.pop();
        
        continue;
      }
      
      importingFolders.push(fsEntry);
    }
    
    const path = importingFolders.map(f => '/' + f).join('');
    
    return new ModulePath(importingPath.packageId, path);
  }
  
  private resolveExternalImport(ast: ExternalImportAst, packageJson: PackageJson): ImportedPath {
    const packageId = packageJson.resolveRef(
      ast.parsedPath.registry,
      ast.parsedPath.scope,
      ast.parsedPath.name,
      ast.parsedPath.versionAlias,
    );
    
    if (typeof packageId === 'symbol') return packageId;
    
    return new ModulePath(packageId, ast.parsedPath.rest);
  }
}
