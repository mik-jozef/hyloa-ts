import { Caten, IdentifierToken, Match, Maybe, Or, Repeat, SyntaxTreeNode } from "lr-parser-typescript";

import { ClassLiteral, matchTypeExprRung as matchTypeExprRung0 } from "./class-literal.js";
import {
  LetDeclaration,
  matchTypeExprRung as matchTypeExprRung1,
  matchBodyExprRung,
  matchDefaultArgExprRung,
} from "./let-declaration.js";
import { token } from "./tokenizer.js";
import { TokenKind } from "lr-parser-typescript/local/out/tokenizer.js";


const matchValueClassLiteral = new Match(false, 'value', null!);
const matchValueObjectLiteral = new Match(false, 'value', null!);
const matchValueArrayLiteral = new Match(false, 'value', null!);
const matchValueProcedureCall = new Match(false, 'value', null!);
const matchValueMemberAccess = new Match(false, 'value', null!);
const matchValueTypeArguments = new Match(false, 'value', null!);
const matchValueNegation = new Match(false, 'value', null!);
const matchValueInverse = new Match(false, 'value', null!);
const matchValueAwait = new Match(false, 'value', null!);
const matchValueMul = new Match(false, 'value', null!);
const matchValueDiv = new Match(false, 'value', null!);
const matchValueAdd = new Match(false, 'value', null!);
const matchValueSub = new Match(false, 'value', null!);
const matchValueComparison = new Match(false, 'value', null!);
const matchValueIntersection = new Match(false, 'value', null!);
const matchValueUnion = new Match(false, 'value', null!);
const matchValueConditional = new Match(false, 'value', null!);
const matchValueAssignment = new Match(false, 'value', null!);
const matchValueReturn = new Match(false, 'value', null!);
const matchValueUniversalQuantifer = new Match(false, 'value', null!);
const matchValueExistentialQuantifier = new Match(false, 'value', null!);
const matchValueExprRung = new Match(false, 'value', null!);

export class StringLiteral extends SyntaxTreeNode {
  static rule = token('text');
}

export class NumberLiteral extends SyntaxTreeNode {
  static rule = token('number');
}

export class TextLiteral extends SyntaxTreeNode {
  static rule = new Or(); // TODO
}

type BottomExprs =
  | ClassLiteral
  | ObjectLiteral
  | ArrayLiteral
  | StringLiteral // Unformatted utf-8 string.
  | TextLiteral // Markdown (or simillarly) formatted text.
  | NumberLiteral
  | IdentifierToken
  | ProcedureCall
  | MemberAccess
  | TypeArguments
;

export class BottomRung extends SyntaxTreeNode {
  static hidden = true;
  
  static rule = new Or(
    matchValueClassLiteral,
    matchValueObjectLiteral,
    matchValueArrayLiteral,
    new Match(false, 'value', StringLiteral),
    new Match(false, 'value', TextLiteral),
    new Match(false, 'value', NumberLiteral),
    new Match(false, 'value', token('identifier')),
    matchValueProcedureCall,
    matchValueMemberAccess,
    matchValueTypeArguments,
    new Caten(
      token('('),
      matchValueExprRung,
      token(')'),
    ),
  )
}

type LeftUnaryOpsOrLower =
  | Negation
  | Inverse
  | Await
  | BottomExprs
;

export class LeftUnaryOpsRung extends SyntaxTreeNode {
  static hidden = true;
  
  static rule = new Or(
    matchValueNegation,
    matchValueInverse,
    matchValueAwait,
    new Match( false, 'value', BottomRung ),
  );
}

type MulDivOpsOrLower =
  | Mul
  | Div
  | LeftUnaryOpsOrLower
;

export class MulDivOpsRung extends SyntaxTreeNode {
  static hidden = true;
  
  static rule = new Or(
    matchValueMul,
    matchValueDiv,
    new Match(false, 'value', LeftUnaryOpsRung),
  );
}

type AddSubOpsOrLower =
  | Add
  | Sub
  | MulDivOpsOrLower
;

export class AddSubOpsRung extends SyntaxTreeNode {
  static hidden = true;
  
  static rule = new Or(
    matchValueAdd,
    matchValueSub,
    new Match(false, 'value', MulDivOpsRung),
  );
}

// TODO magma operator?

export type ComparisonOrLower =
  | Comparison
  | AddSubOpsOrLower
;

export class ComparisonRung extends SyntaxTreeNode {
  static hidden = true;
  
  static rule = new Or(
    matchValueComparison,
    new Match(false, 'value', AddSubOpsRung),
  );
}

export type IntersectionOrLower =
  | Intersection
  | ComparisonOrLower
;

export class IntersectionRung extends SyntaxTreeNode {
  static hidden = true;
  
  static rule = new Or(
    matchValueIntersection,
    new Match(false, 'value', ComparisonRung),
  );
}

export type UnionOrLower =
  | Union
  | IntersectionOrLower
;

export class UnionRung extends SyntaxTreeNode {
  static hidden = true;
  
  static rule = new Or(
    matchValueUnion,
    new Match(false, 'value', IntersectionRung),
  );
}

export type ConditionalOrLower =
  | Conditional
  | IntersectionOrLower
;

export class ConditionalRung extends SyntaxTreeNode {
  static hidden = true;
  
  static rule = new Or(
    matchValueConditional,
    matchValueAssignment,
    new Match(false, 'value', UnionRung),
  );
}

export type Expr =
  | Return
  | UniversalQuantifier
  | ExistentialQuantifier
  | ConditionalOrLower
  | LetDeclaration
;

export class ExprRung extends SyntaxTreeNode {
  static hidden = true;
  
  static rule = new Or(
    matchValueReturn,
    matchValueUniversalQuantifer,
    matchValueExistentialQuantifier,
    new Match(false, 'value', LetDeclaration),
    new Match(false, 'value', ConditionalRung),
  );
}

// End of the ladder.

export class Negation extends SyntaxTreeNode {
  expr!: LeftUnaryOpsOrLower;
  
  static rule = new Caten(
    token('!'),
    new Match(false, 'expr', LeftUnaryOpsRung),
  );
}

export class Inverse extends SyntaxTreeNode {
  expr!: LeftUnaryOpsOrLower;
  
  static rule = new Caten(
    token('-'),
    new Match(false, 'expr', LeftUnaryOpsRung),
  );
}

export class Await extends SyntaxTreeNode {
  expr!: LeftUnaryOpsOrLower;
  
  static rule = new Caten(
    token('await'),
    new Match(false, 'expr', LeftUnaryOpsRung),
  );
}

class ObjectProperty extends SyntaxTreeNode {
  name!: IdentifierToken;
  value!: Expr;
  
  static rule = new Caten(
    new Match(false, 'name', token('identifier')),
    token(':'),
    new Match(false, 'value', ExprRung),
  );
}

export class ObjectLiteral extends SyntaxTreeNode {
  properties!: ObjectProperty[];
  
  static rule = new Caten(
    token('{'),
    new Repeat(new Match(true, 'properties', ObjectProperty), {
      delimiter: token(','),
      trailingDelimiter: true,
    }),
    token('}'),
  );
}

export class ArrayLiteral extends SyntaxTreeNode {
  elements!: Expr[];
  
  static rule = new Caten(
    token('['),
    new Repeat(new Match(true, 'elements', ExprRung), {
      delimiter: token(','),
      trailingDelimiter: true,
    }),
    token(']'),
  );
}

export class ProcedureCall extends SyntaxTreeNode {
  procedure!: BottomExprs;
  args!: Expr[];
  
  static rule = new Caten(
    new Match(false, 'procedure', BottomRung),
    token('('),
    new Repeat(new Match(true, 'args', ExprRung), {
      delimiter: token(','),
      trailingDelimiter: true,
    }),
    token(')'),
  );
}

export class MemberAccess extends SyntaxTreeNode {
  expr!: BottomExprs;
  op!: TokenKind<'.'> | TokenKind<'?.'>
  memberName!: IdentifierToken;
  
  static rule = new Caten(
    new Match(false, 'expr', BottomRung),
    new Or(
      new Match(false, 'op', token('.')),
      new Match(false, 'op', token('?.')),
    ),
    new Match(false, 'memberName', token('identifier')),
  );
}

export class TypeArguments extends SyntaxTreeNode {
  static rule = new Caten(
    new Match(false, 'expr', BottomRung),
    token('['),
    new Repeat(new Match(true, 'args', ExprRung), {
      delimiter: token(','),
      trailingDelimiter: true,
    }),
    token(']'),
  );
}

export class Mul extends SyntaxTreeNode {
  left!: LeftUnaryOpsOrLower;
  rite!: LeftUnaryOpsOrLower;
  
  static rule = new Caten(
    new Match(false, 'left', LeftUnaryOpsRung),
    token('*'),
    new Match(false, 'rite', LeftUnaryOpsRung),
  );
}

export class Div extends SyntaxTreeNode {
  left!: LeftUnaryOpsOrLower;
  rite!: LeftUnaryOpsOrLower;
  
  static rule = new Caten(
    new Match(false, 'left', LeftUnaryOpsRung),
    token('/'),
    new Match(false, 'rite', LeftUnaryOpsRung),
  );
}

export class Add extends SyntaxTreeNode {
  left!: MulDivOpsOrLower;
  rite!: MulDivOpsOrLower;
  
  static rule = new Caten(
    new Match(false, 'left', MulDivOpsRung),
    token('+'),
    new Match(false, 'rite', MulDivOpsRung),
  );
}

export class Sub extends SyntaxTreeNode {
  left!: MulDivOpsOrLower;
  rite!: MulDivOpsOrLower;
  
  static rule = new Caten(
    new Match(false, 'left', MulDivOpsRung),
    token('-'),
    new Match(false, 'rite', MulDivOpsRung),
  );
}

export class Comparison extends SyntaxTreeNode {
  exprs!: AddSubOpsOrLower;
  operators!: MulDivOpsRung;
  
  static rule = new Repeat(new Match(true, 'exprs', AddSubOpsRung), {
    delimiter: new Or(
      new Match(true, 'operators', token('<')),
      new Match(true, 'operators', token('<=')),
      new Match(true, 'operators', token('==')),
      new Match(true, 'operators', token('>=')),
      new Match(true, 'operators', token('>')),
    ),
    lowerBound: 2,
  });
}

export class Intersection extends SyntaxTreeNode {
  left!: ComparisonOrLower;
  rite!: ComparisonOrLower;
  
  static rule = new Caten(
    new Match(false, 'left', ComparisonRung),
    token('&'),
    new Match(false, 'rite', ComparisonRung),
  );
}

export class Union extends SyntaxTreeNode {
  left!: IntersectionOrLower;
  rite!: IntersectionOrLower;
  
  static rule = new Caten(
    new Match(false, 'left', IntersectionRung),
    token('|'),
    new Match(false, 'rite', IntersectionRung),
  );
}

export class Conditional extends SyntaxTreeNode {
  conditional!: UnionOrLower;
  ifPos!: Expr | null;
  ifNeg!: ConditionalOrLower | null;
  
  static rule = new Caten(
    new Match(false, 'cond', UnionRung),
    new Or(
      new Caten(
        token('then'), // Alternatively: ?
        new Match(false, 'ifPos', ExprRung),
        token('else'), // Alternatively: :
        new Match(false, 'ifNeg', ConditionalRung),
      ),
      new Caten(
        token('thand'), // Alternatively: ?.
        new Match(false, 'ifPos', ConditionalRung),
      ),
      new Caten(
        token('thelse'), // Alternatively: ?:
        new Match(false, 'ifNeg', ConditionalRung),
      ),
    ),
  );
}

// Alternatives: `<<` (`<<*`) or `<:` (`<:*`) or `:=`
export class Assignment extends SyntaxTreeNode {
  left!: UnionOrLower;
  rite!: ComparisonOrLower;
  
  static rule: Caten = new Caten(
    new Match(false, 'left', UnionRung),
    // TODO add param "allowsAssignment" which you set to false, so you
    // can replace this with `:=`.
    token('<<'),
    new Match(false, 'rite', ComparisonRung),
  );
}

export class Return extends SyntaxTreeNode {
  expr!: Expr;
  
  static rule: Caten = new Caten(
    token('return'),
    new Match(false, 'expr', ExprRung),
  );
}

export class UniversalQuantifier extends SyntaxTreeNode {
  varName!: IdentifierToken;
  domain!: Expr;
  body!: Expr;
  
  static rule: Caten = new Caten(
    token('All'),
    new Match(false, 'varName', token('identifier')),
    new Maybe(
      new Caten(
        token(':'),
        new Match(false, 'domain', ExprRung),
      ),
    ),
    token('..'),
    new Match(false, 'body', ExprRung),
  );
}

export class ExistentialQuantifier extends SyntaxTreeNode {
  varName!: IdentifierToken;
  domain!: Expr;
  body!: Expr;
  
  static rule: Caten = new Caten(
    token('Ex'),
    new Match(false, 'varName', token('identifier')),
    new Maybe(
      new Caten(
        token(':'),
        new Match(false, 'domain', ExprRung),
      ),
    ),
    token('..'),
    new Match(false, 'body', ExprRung),
  );
}

matchValueClassLiteral.match = ClassLiteral;
matchValueObjectLiteral.match = ObjectLiteral;
matchValueArrayLiteral.match = ArrayLiteral;
matchValueProcedureCall.match = ProcedureCall;
matchValueMemberAccess.match = MemberAccess;
matchValueTypeArguments.match = TypeArguments;
matchValueNegation.match = Negation;
matchValueInverse.match = Inverse;
matchValueAwait.match = Await;
matchValueMul.match = Mul;
matchValueDiv.match = Div;
matchValueAdd.match = Add;
matchValueSub.match = Sub;
matchValueComparison.match = Comparison;
matchValueIntersection.match = Intersection;
matchValueUnion.match = Union;
matchValueConditional.match = Conditional;
matchValueAssignment.match = Assignment;
matchValueReturn.match = Return;
matchValueUniversalQuantifer.match = UniversalQuantifier;
matchValueExistentialQuantifier.match = ExistentialQuantifier;
matchValueExprRung.match = ExprRung;

matchTypeExprRung0.match = ExprRung;
matchTypeExprRung1.match = ExprRung;
matchBodyExprRung.match = ExprRung;
matchDefaultArgExprRung.match = ExprRung;
