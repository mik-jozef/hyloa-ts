import { SyntaxTreeNode, Caten, IdentifierToken } from 'lr-parser-typescript';

import { token } from './tokenizer.js';


export type ClassDeclaration = classDeclarations;
export class classDeclarations extends SyntaxTreeNode {
  name!: IdentifierToken;
  
  // TODO
  static rule = new Caten(
    token('class'),
  );
}
