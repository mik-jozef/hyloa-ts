import { SyntaxTreeNode, Caten, IdentifierToken, Maybe, Match, Or, Repeat, Token } from 'lr-parser-typescript';

import { DestructuredMembers, Expr } from './expressions.js';
import { token } from './tokenizer.js';


export const matchDefaultArgExprRung = new Match(false, 'defaultArg', null!);
export const matchTypeExprRung = new Match(false, 'type', null!);
export const matchBodyExprRung = new Match(true, 'body', null!);
export const matchTypeDestructuredMembers = new Match(false, 'type', null!);

export class Param extends SyntaxTreeNode {
  name!: IdentifierToken;
  type!: Expr | null;
  defaultArg!: Expr | null;
  members!: DestructuredMembers | null;
  
  static rule = new Caten(
    new Match(false, 'name', token('identifier')),
    new Or(
      new Caten(),
      matchTypeDestructuredMembers,
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
  params!: Param[];
  type!: Expr;
  
  static rule = new Caten(
    token('let'),
    new Maybe(new Match(false, 'name', token('identifier'))),
    
    new Maybe(
      new Caten(
        new Match(false, 'hasParams', token('(')),
        new Repeat(
          new Match(true, 'params', Param),
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
  _TS: 'LetDeclaration' = 'LetDeclaration';
  
  head!: LetDeclarationHead;
  asn!: Token<':='> | null;
  body!: (Expr | LetDeclarationHead)[];
  
  static rule = new Caten(
    new Match(false, 'head', LetDeclarationHead),
    
    new Or(
      new Caten(
        new Match(false, 'asn', token(':=')),
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
