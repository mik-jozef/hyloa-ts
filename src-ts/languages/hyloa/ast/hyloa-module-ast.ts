import { Caten, Match, Or, Repeat } from 'lr-parser-typescript';
import { ModuleAst } from '../../module.js';

import { ClassLiteral } from './class-literal.js';
import { HyloaImportAst } from './hyloa-import-ast.js';
import { LetDeclaration } from './let-declaration.js';

// This is here only bc JS/TS does not handle circular class references.
import "./expressions.js";


type Declaration = LetDeclaration | ClassLiteral;

export class HyloaModuleAst extends ModuleAst {
  imports!: HyloaImportAst[];
  defs!: Declaration[];

  static rule = new Caten(
    new Repeat(
      new Match(true, 'imports', HyloaImportAst),
    ),
    new Repeat(
      new Or(
        new Match(true, 'defs', LetDeclaration),
        new Match(true, 'defs', ClassLiteral),
      ),
    ),
  );
}
