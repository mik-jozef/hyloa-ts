import { SyntaxTreeNode as syntaxTreeNodes, Caten, IdentifierToken, Maybe, Match } from 'lr-parser-typescript';

import { token } from './tokenizer.js';


const matchType = new Match(false, 'type', token('identifier'));

export type LetDeclaration = letDeclarations;
export class letDeclarations extends syntaxTreeNodes {
  name!: IdentifierToken | null;
  
  // TODO
  static rule = new Caten(
    token('let'),
    new Maybe(new Match(false, 'name', token('identifier'))),
    
    new Maybe(
      new Caten(
        token(':'),
        matchType,
      ),
    ),
  );
}
