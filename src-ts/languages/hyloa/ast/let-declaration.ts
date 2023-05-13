import { SyntaxTreeNode as syntaxTreeNodes, Caten, IdentifierToken, Maybe, Match, Or, Repeat } from 'lr-parser-typescript';

import { Expr } from './expressions.js';
import { token } from './tokenizer.js';


export const matchParamsExprRung = new Match(true, 'params', null!);
export const matchTypeExprRung = new Match(false, 'type', null!);
export const matchBodyExprRung = new Match(true, 'body', null!);

export class LetDeclaration extends syntaxTreeNodes {
  name!: IdentifierToken | null;
  params!: Expr;
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
        new Repeat(matchParamsExprRung, {
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
