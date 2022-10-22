import { SyntaxTreeNode, Caten, IdentifierToken } from 'lr-parser-typescript';

import { token } from './tokenizer.js';


export class LetDeclaration extends SyntaxTreeNode {
  name!: IdentifierToken;
  
  // TODO
  static rule = new Caten(
    token('let'),
  );
}
