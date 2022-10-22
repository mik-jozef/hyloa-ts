import { SyntaxTreeNode, Caten, Match, Or, Repeat } from 'lr-parser-typescript';
import { ClassDeclaration } from './class-declaration.js';

import { ImportAst } from './import-ast.js';
import { LetDeclaration } from './let-declaration.js';


type Declaration = LetDeclaration | ClassDeclaration;

export class ModuleAst extends SyntaxTreeNode {
  imports!: ImportAst[];
  defs!: Declaration[];
  
  static rule = new Caten(
    new Repeat(
      new Match( true, 'imports', ImportAst ),
    ),
    new Repeat(
      new Or(
        new Match( true, 'defs', LetDeclaration ),
        new Match( true, 'defs', ClassDeclaration ),
      ),
    ),
  );
}
