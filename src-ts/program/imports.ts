import { importsAst } from "../syntax-tree/imports-ast";
import { ModulePath } from "./modules";


export type Import = imports;
export class imports {
  // Null means the path escapes the root.
  public importedPath: ModulePath | null;
  
  constructor(
    public ast: importsAst,
    importingPath: ModulePath,
  ) {
    this.importedPath = importingPath.resolveImport(ast.path);
  }
}
