import { Caten, Match, Or, Repeat } from 'lr-parser-typescript';
import { ModuleAst } from '../../module.js';
import { LetDeclaration } from './expressions.js';
import { LyoImportAst } from './lyo-import-ast.js';
import { token } from './tokenizer.js';


export class LyoModuleAst extends ModuleAst {
  imports!: LyoImportAst[];
  defs!: LetDeclaration[];

  static rule = new Caten(
    new Repeat(
      new Match(true, 'imports', LyoImportAst),
    ),
    new Repeat(
      new Or(
        new Caten(
          new Match(true, 'defs', LetDeclaration),
          token(';'),
        ),
      ),
    ),
  );
}
