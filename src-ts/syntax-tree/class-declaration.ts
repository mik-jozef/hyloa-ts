import { SyntaxTreeNode, Caten, IdentifierToken } from 'lr-parser-typescript';

import { token } from './tokenizer.js';


export class ClassDeclaration extends SyntaxTreeNode {
  name!: IdentifierToken;
  
  // TODO
  static rule = new Caten(
    token('class'),
  );
}
