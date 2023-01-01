import { SyntaxTreeNode as syntaxTreeNodes, Caten, IdentifierToken, Maybe, Match } from 'lr-parser-typescript';

import { token } from './tokenizer.js';


export const matchTypeExprRung = new Match(false, 'type', null!);

export class LetDeclaration extends syntaxTreeNodes {
  name!: IdentifierToken | null;
  
  // TODO
  static rule = new Caten(
    token('let'),
    new Maybe(new Match(false, 'name', token('identifier'))),
    
    new Maybe(
      new Caten(
        token(':'),
        matchTypeExprRung,
      ),
    ),
  );
}
