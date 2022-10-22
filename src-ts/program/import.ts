import { ImportAst } from "../syntax-tree/import-ast";
import { ModulePath } from "./module";


export class Import {
  // Null means the path escapes the root.
  public importedPath: ModulePath | null;
  
  constructor(
    public ast: ImportAst,
    importingPath: ModulePath,
  ) {
    this.importedPath = importingPath.resolveImport(ast.path);
  }
}
