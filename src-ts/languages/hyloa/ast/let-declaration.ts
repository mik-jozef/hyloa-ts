import { Caten, Match, MatchArr, Maybe, Or, Repeat, SyntaxTreeNode, Token } from 'lr-parser-typescript';

import { DestructuredMembers, Expr } from './expressions.js';
import { IdentifierToken } from '../../create-tokenizer.js';


export const matchDefaultArgExprRung = new Match('defaultArg', null!);
export const matchTypeExprRung = new Match('type', null!, 'matchTypeExprRung letdec');
export const matchBodyExprRung = new MatchArr('body', null!, 'matchBodyExprRung');
export const matchTypeDestructuredMembers = new Match('type', null!);

export class Param extends SyntaxTreeNode {
  name!: IdentifierToken;
  type!: Expr | null;
  defaultArg!: Expr | null;
  members!: DestructuredMembers | null;
  
  static pattern = new Caten(
    new Match('name', 'identifier'),
    new Or(
      new Caten(),
      matchTypeDestructuredMembers,
      new Caten(
        ':',
        matchTypeExprRung,
      ),
    ),
    new Maybe(
      new Caten(
        ':=',
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
  
  static pattern = new Caten(
    'let',
    new Maybe(new Match('name', 'identifier')),
    
    new Maybe(
      new Caten(
        new Match('hasParams', '('),
        new Repeat(
          new MatchArr('params', Param),
          {
            delimiter: ',',
            trailingDelimiter: true,
          },
        ),
        ')',
      ),
    ),
    
    new Maybe(
      new Caten(
        ':',
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
  
  static pattern = new Caten(
    new Match('head', LetDeclarationHead),
    
    new Or(
      new Caten(
        new Match('asn', ':='),
        matchBodyExprRung,
      ),
      new Caten(
        '{',
        new Repeat(
          new Or(
            matchBodyExprRung,
            new MatchArr('body', LetDeclarationHead),
          ),
          {
            delimiter: ';',
            trailingDelimiter: true,
          },
        ),
        '}',
      ),
    ),
  );
}
