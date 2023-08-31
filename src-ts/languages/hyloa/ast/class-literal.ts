import { SyntaxTreeNode, Caten, IdentifierToken, Match, Maybe, Or, Repeat, Token } from 'lr-parser-typescript';

import { token } from './tokenizer.js';
import { LetDeclaration, LetDeclarationHead } from './let-declaration.js';


export const matchTypeExprRung = new Match(false, 'type', null!);

export class ClassMember extends SyntaxTreeNode {
  isPrivate!: Token<'private'> | null;
  isStatic!: Token<'static'> | null;
  declaration!: LetDeclaration | LetDeclarationHead;
  
  static rule = new Caten(
    new Maybe(
      new Match(false, 'isPrivate', token('private')),
    ),
    new Maybe(
      new Match(false, 'isStatic', token('static')),
    ),
    new Or(
      new Match(false, 'declaration', LetDeclaration),
      new Match(false, 'declaration', LetDeclarationHead),
    ),
  );
}

export class ClassLiteral extends SyntaxTreeNode {
  typeName!: IdentifierToken;
  constructorName!: IdentifierToken;
  members!: ClassMember;
  
  // TODO
  static rule = new Caten(
    token('class'),
    new Match(false, 'typeName', token('identifier')),
    // By default equals `make$typeName`.
    new Maybe(new Match(false, 'constructorName', token('identifier'))),
    token('{'),
    new Repeat(
      new Caten(
        new Match(true, 'members', ClassMember),
        token(';'),
      ),
    ),
    token('}'),
  );
}
