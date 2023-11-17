import { Caten, MatchArr, Or, Repeat } from 'lr-parser-typescript';
import { ModuleAst } from '../../module.js';
import { LetDeclaration } from './expressions.js';
import { LyoImportAst } from './lyo-import-ast.js';


export class LyoModuleAst extends ModuleAst {
  imports!: LyoImportAst[];
  defs!: LetDeclaration[];

  static pattern = new Caten(
    new Repeat(
      new MatchArr('imports', LyoImportAst),
    ),
    new Repeat(
      new Or(
        new Caten(
          new MatchArr('defs', LetDeclaration),
          ';',
        ),
      ),
    ),
  );
}
