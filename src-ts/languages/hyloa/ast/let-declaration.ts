import { SyntaxTreeNode, Caten, IdentifierToken, Maybe, Match, Or, Repeat } from 'lr-parser-typescript';

import { Expr } from './expressions.js';
import { token } from './tokenizer.js';


export const matchDefaultArgExprRung = new Match(true, 'defaultArg', null!);
export const matchTypeExprRung = new Match(false, 'type', null!);
export const matchBodyExprRung = new Match(true, 'body', null!);

class Param extends SyntaxTreeNode {
  name!: IdentifierToken;
  type!: Expr;
  defaultArg!: Expr;
  
  static rule = new Caten( // TODO destructuring: "let x({ a }) := a"
    new Match(false, 'name', token('identifier')),
    new Maybe(
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
  params!: Param[];
  type!: Expr;
  
  static rule = new Caten(
    token('let'),
    new Maybe(new Match(false, 'name', token('identifier'))),
    
    new Or(
      new Caten(),
      // TODO destructuring,
      new Caten(
        token('('),
        new Repeat(new Match(true, 'params', Param), {
          delimiter: token(','),
          trailingDelimiter: true,
        }),
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
