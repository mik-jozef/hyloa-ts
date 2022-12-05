import { SyntaxTreeNode, Caten, Match, Or, Repeat } from 'lr-parser-typescript';
import { classDeclarations } from './class-declarations.js';

import { importsAst } from './imports-sts.js';
import { letDeclarations } from './let-declarations.js';


type Declaration = letDeclarations | classDeclarations;

export class modulesAst extends SyntaxTreeNode {
  imports!: importsAst[];
  defs!: Declaration[];
  
  static rule = new Caten(
    new Repeat(
      new Match( true, 'imports', importsAst ),
    ),
    new Repeat(
      new Or(
        new Match( true, 'defs', letDeclarations ),
        new Match( true, 'defs', classDeclarations ),
      ),
    ),
  );
}
