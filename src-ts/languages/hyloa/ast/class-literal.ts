import { SyntaxTreeNode, Caten, IdentifierToken, Match, Maybe, Repeat, Token } from 'lr-parser-typescript';
import { Expr } from './expressions.js';

import { token } from './tokenizer.js';


export const matchTypeExprRung = new Match(false, 'type', null!);

export class ClassMember extends SyntaxTreeNode {
  name!: IdentifierToken;
  type!: Expr;
  initializer!: Expr;
  isPrivate!: Token<'private'> | null;
  isStatic!: Token<'static'> | null;
  
  static rule = new Caten(
    new Maybe(
      new Match(false, 'isPrivate', token('private')),
    ),
    new Maybe(
      new Match(false, 'isStatic', token('static')),
    ),
    token('identifier'),
    new Maybe(
      new Caten(
        token(':'),
        matchTypeExprRung,
      ),
    ),
  );
}

export class ClassLiteral extends SyntaxTreeNode {
  typeName!: IdentifierToken;
  constructorName!: IdentifierToken;
  members!: IdentifierToken;
  
  // TODO
  static rule = new Caten(
    token('class'),
    new Match(false, 'typeName', token('identifier')),
    // By default equals `make$typeName`.
    new Maybe(new Match(false, 'constructorName', token('identifier'))),
    token('{'),
    new Repeat(
      new Match(true, 'members', ClassMember)
    ),
    token('}'),
  );
}
