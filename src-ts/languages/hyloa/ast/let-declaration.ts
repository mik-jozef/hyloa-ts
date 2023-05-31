import { SyntaxTreeNode, Caten, IdentifierToken, Maybe, Match, Or, Repeat } from 'lr-parser-typescript';

import { Expr } from './expressions.js';
import { token } from './tokenizer.js';


export const matchDefaultArgExprRung = new Match(true, 'defaultArg', null!);
export const matchTypeExprRung = new Match(false, 'type', null!);
export const matchBodyExprRung = new Match(true, 'body', null!);

class Param extends SyntaxTreeNode {
  name!: IdentifierToken;
  type!: Expr;
  
  static rule = new Caten(
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

export class LetDeclaration extends SyntaxTreeNode {
  name!: IdentifierToken | null;
  params!: Param[];
  type!: Expr;
  body!: Expr;
  
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
    
    new Or(
      new Caten(
        token(':='),
        matchBodyExprRung,
      ),
      new Caten(
        token('{'),
        matchBodyExprRung,
        token('}'),
      ),
    ),
  );
}
