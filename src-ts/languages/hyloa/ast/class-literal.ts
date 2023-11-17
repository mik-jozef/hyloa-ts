import { Caten, Match, MatchArr, Maybe, Or, Repeat, SyntaxTreeNode, Token } from 'lr-parser-typescript';

import { IdentifierToken } from '../../create-tokenizer.js';
import { LetDeclaration, LetDeclarationHead } from './let-declaration.js';


export const matchTypeExprRung = new Match('type', null!);

export class ClassMember extends SyntaxTreeNode {
  isPrivate!: Token<'private'> | null;
  isStatic!: Token<'static'> | null;
  declaration!: LetDeclaration | LetDeclarationHead;
  
  static pattern = new Caten(
    new Maybe(
      new Match('isPrivate', 'private'),
    ),
    new Maybe(
      new Match('isStatic', 'static'),
    ),
    new Or(
      new Match('declaration', LetDeclaration),
      new Match('declaration', LetDeclarationHead),
    ),
  );
}

export class ClassLiteral extends SyntaxTreeNode {
  typeName!: IdentifierToken;
  constructorName!: IdentifierToken;
  members!: ClassMember;
  
  // TODO
  static pattern = new Caten(
    'class',
    new Match('typeName', 'identifier'),
    // By default equals `make$typeName`.
    new Maybe(new Match('constructorName', 'identifier')),
    '{',
    new Repeat(
      new Caten(
        new MatchArr('members', ClassMember),
        ';',
      ),
    ),
    '}',
  );
}
