import { SyntaxTreeNode, Caten, IdentifierToken, Maybe, Match, Or, Repeat, Token } from 'lr-parser-typescript';

import { DestructuredMembers, Expr } from './expressions.js';
import { token } from './tokenizer.js';


export const matchDefaultArgExprRung = new Match(true, 'defaultArg', null!);
export const matchTypeExprRung = new Match(false, 'type', null!);
export const matchBodyExprRung = new Match(true, 'body', null!);
export const matchParamsDestructuredMembers = new Match(true, 'params', null!);
export const matchMembersDestructuredMembers = new Match(true, 'members', null!);

export class Param extends SyntaxTreeNode {
  name!: IdentifierToken;
  type!: Expr;
  defaultArg!: Expr;
  members!: DestructuredMembers;
  
  static rule = new Caten(
    new Match(false, 'name', token('identifier')),
    new Or(
      new Caten(),
      matchMembersDestructuredMembers,
      new Caten(
        token(':'),
        matchTypeExprRung,
      ),
    ),
    new Maybe(
      new Caten(
        token(':='),
        matchDefaultArgExprRung,
      ),
    ),
  );
}

export class LetDeclarationHead extends SyntaxTreeNode {
  name!: IdentifierToken | null;
  hasParams!: Token<'('> | null;
  params!: (Param | DestructuredMembers)[];
  type!: Expr;
  
  static rule = new Caten(
    token('let'),
    new Maybe(new Match(false, 'name', token('identifier'))),
    
    new Or(
      new Caten(),
      // TODO destructuring: `let { a } := ...;`.
      new Caten(
        new Match(false, 'hasParams', token('(')),
        new Repeat(
          new Or(
            new Match(true, 'params', Param),
            matchParamsDestructuredMembers,
          ),
          {
            delimiter: token(','),
            trailingDelimiter: true,
          },
        ),
        token(')'),
      ),
    ),
    
    new Maybe(
      new Caten(
        token(':'),
        matchTypeExprRung,
      ),
    ),
  );
}

// TODO add param isClassMember which removes the let token
// and adds colons at the end unless ending with '}'.
export class LetDeclaration extends SyntaxTreeNode {
  head!: LetDeclarationHead;
  body!: (Expr | LetDeclarationHead)[];
  
  static rule = new Caten(
    new Match(false, 'head', LetDeclarationHead),
    
    new Or(
      new Caten(
        token(':='),
        matchBodyExprRung,
      ),
      new Caten(
        token('{'),
        new Repeat(
          new Or(
            matchBodyExprRung,
            new Match(true, 'body', LetDeclarationHead),
          ),
          {
            delimiter: token(';'),
            trailingDelimiter: true,
          },
        ),
        token('}'),
      ),
    ),
  );
}
