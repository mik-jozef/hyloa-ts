import { Caten, IdentifierToken, Match, Maybe, Or, Repeat, SyntaxTreeNode, Token } from "lr-parser-typescript";
import { token } from "./tokenizer.js";


let matchValueSetEnumeration = new Match(false, 'value', null!);
let matchValueLetDeclaration = new Match(false, 'value', null!);
let matchValueQuantifier = new Match(false, 'value', null!);

export type BottomRungOrLower =
  | IdentifierToken
  | SetEnumeration
;

export class BottomRung extends SyntaxTreeNode {
  static hidden = true;
  
  static rule = new Or(
    token('identifier'),
    matchValueSetEnumeration,
  );
}

export type Expr =
  | LetDeclaration
  | BottomRungOrLower
;

export class ExprRung extends SyntaxTreeNode {
  static hidden = true;
  
  static rule = new Or(
    matchValueLetDeclaration,
    new Match(false, 'value', BottomRung),
  );
}

// End of the ladder.

export class SetEnumeration extends SyntaxTreeNode {
  elements!: IdentifierToken;
  
  static rule = new Caten(
    token('{'),
    new Or(
      new Repeat(
        new Caten(
          new Match(true, 'elements', ExprRung),
          token(','),
        ),
        new Caten(),
        1
      ),
      token(','),
    ),
    token('}'),
  );
}

export class LetDeclaration extends SyntaxTreeNode {
  name!: IdentifierToken;
  body!: Expr;
  
  static rule = new Caten(
    token('let'),
    new Match(false, 'name', token('identifier')),
    token(':'),
    new Match(false, 'body', new Match(false, 'body', ExprRung)),
  );
}

export class Quantifier extends SyntaxTreeNode {
  qType!: Token<'Ex'> | Token<'All'>;
  
  name!: IdentifierToken;
  type!: Expr | null;
  
  static rule = new Caten(
    new Or(
      new Match(false, 'qType', token('Ex')),
      new Match(false, 'qType', token('All')),
    ),
    new Match(false, 'name', token('identifier')),
    new Maybe(
      new Caten(
        token(':'),
        new Match(false, 'type', ExprRung),
      ),
    ),
    new Or(
      new Caten(
        token('..'),
        new Match(false, 'body', ExprRung),
        new Or(), // Not supported yet
      ),
    ),
  );
}

matchValueSetEnumeration.match = SetEnumeration;
matchValueLetDeclaration.match = LetDeclaration;
matchValueQuantifier.match = Quantifier;
