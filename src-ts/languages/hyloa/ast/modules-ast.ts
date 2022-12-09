import { SyntaxTreeNode, Caten, Match, Or, Repeat } from 'lr-parser-typescript';

import { makeClassDeclaration } from './class-declarations.js';
import { hyloaImportAsts } from './imports-asts.js';
import { makeLetDeclaration } from './let-declarations.js';


type Declaration = makeLetDeclaration | makeClassDeclaration;

export type ModuleAst = makeModuleAst;
export class makeModuleAst extends SyntaxTreeNode {
  imports!: hyloaImportAsts[];
  defs!: Declaration[];

  static rule = new Caten(
    new Repeat(
      new Match(true, 'imports', hyloaImportAsts),
    ),
    new Repeat(
      new Or(
        new Match(true, 'defs', makeLetDeclaration),
        new Match(true, 'defs', makeClassDeclaration),
      ),
    ),
  );
}
