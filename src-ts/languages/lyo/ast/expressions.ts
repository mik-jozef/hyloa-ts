import { Caten, Match, MatchArr, Maybe, Or, Repeat, SyntaxTreeNode, Token } from "lr-parser-typescript";
import { IdentifierToken } from "../../create-tokenizer.js";


let matchValueSetEnumeration = new Match('value', null!);
let matchValueLetDeclaration = new Match('value', null!);
let matchValueQuantifier = new Match('value', null!);

export type BottomRungOrLower =
  | IdentifierToken
  | SetEnumeration
;

export class BottomRung extends SyntaxTreeNode {
  static hidden = true;
  
  static pattern = new Or(
    'identifier',
    matchValueSetEnumeration,
  );
}

export type Expr =
  | LetDeclaration
  | BottomRungOrLower
;

export class ExprRung extends SyntaxTreeNode {
  static hidden = true;
  
  static pattern = new Or(
    matchValueLetDeclaration,
    new Match('value', BottomRung),
  );
}

// End of the ladder.

export class SetEnumeration extends SyntaxTreeNode {
  elements!: IdentifierToken;
  
  static pattern = new Caten(
    '{',
    new Or(
      new Repeat(
        new Caten(
          new MatchArr('elements', ExprRung),
          ',',
        ),
        { lowerBound: 1 },
      ),
      ',',
    ),
    '}',
  );
}

export class LetDeclaration extends SyntaxTreeNode {
  name!: IdentifierToken;
  body!: Expr;
  
  static pattern = new Caten(
    'let',
    new Match('name', 'identifier'),
    ':',
    new Match('body', new Match('body', ExprRung)),
  );
}

export class Quantifier extends SyntaxTreeNode {
  qType!: Token<'Ex'> | Token<'All'>;
  
  name!: IdentifierToken;
  type!: Expr | null;
  
  static pattern = new Caten(
    new Or(
      new Match('qType', 'Ex'),
      new Match('qType', 'All'),
    ),
    new Match('name', 'identifier'),
    new Maybe(
      new Caten(
        ':',
        new Match('type', ExprRung),
      ),
    ),
    new Or(
      new Caten(
        '..',
        new Match('body', ExprRung),
        new Or(), // Not supported yet
      ),
    ),
  );
}

matchValueSetEnumeration.match = SetEnumeration;
matchValueLetDeclaration.match = LetDeclaration;
matchValueQuantifier.match = Quantifier;
