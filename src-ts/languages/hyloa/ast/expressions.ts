import { Caten, Match, Or, Repeat, SyntaxTreeNode } from "lr-parser-typescript";

import { ClassLiteral, matchTypeExprRung as matchTypeExprRung0 } from "./class-literal.js";
import { LetDeclaration, matchTypeExprRung as matchTypeExprRung1 } from "./let-declaration.js";
import { token } from "./tokenizer.js";


/*/
  TODO variable assignment?:
  - `<<` assigns without any dereference,
  - `<<*` or `<<:` dereferences once and assigns (calls `.assign`)
/*/

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
const matchValueExprRung = new Match(false, 'value', null!);

export class StringLiteral extends SyntaxTreeNode {
  static rule = token('text');
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
  | ProcedureCall
  | MemberAccess
  | TypeArguments
  | LetDeclaration
;

export class BottomRung extends SyntaxTreeNode {
  static hidden = true;
  
  static rule = new Or(
    matchValueClassLiteral,
    matchValueObjectLiteral,
    matchValueArrayLiteral,
    new Match(false, 'value', StringLiteral),
    new Match(false, 'value', TextLiteral),
    matchValueProcedureCall,
    matchValueMemberAccess,
    matchValueTypeArguments,
    new Caten(
      token('('),
      new Or(
        new Match(false, 'value', LetDeclaration),
        matchValueExprRung,
      ),
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
    new Match(false, 'value', UnionRung),
  );
}

export type Expr = ConditionalOrLower;

export class ExprRung extends SyntaxTreeNode {
  static hidden = true;
  
  static rule = new Match(false, 'value', ConditionalRung);
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


export class ObjectLiteral extends SyntaxTreeNode {
  static rule = new Or(); // TODO
}

export class ArrayLiteral extends SyntaxTreeNode {
  static rule = new Or(); // TODO
}

export class ProcedureCall extends SyntaxTreeNode {
  static rule = new Or(); // TODO
}

export class MemberAccess extends SyntaxTreeNode {
  static rule = new Or(); // TODO both . and ?.
}

export class TypeArguments extends SyntaxTreeNode {
  static rule = new Or(); // TODO
}

export class Mul extends SyntaxTreeNode {
  left!: LeftUnaryOpsOrLower;
  right!: LeftUnaryOpsOrLower;
  
  static rule = new Caten(
    new Match(false, 'left', LeftUnaryOpsRung),
    token('*'),
    new Match(false, 'right', LeftUnaryOpsRung),
  );
}

export class Div extends SyntaxTreeNode {
  left!: LeftUnaryOpsOrLower;
  right!: LeftUnaryOpsOrLower;
  
  static rule = new Caten(
    new Match(false, 'left', LeftUnaryOpsRung),
    token('/'),
    new Match(false, 'right', LeftUnaryOpsRung),
  );
}

export class Add extends SyntaxTreeNode {
  left!: MulDivOpsOrLower;
  right!: MulDivOpsOrLower;
  
  static rule = new Caten(
    new Match(false, 'left', MulDivOpsRung),
    token('+'),
    new Match(false, 'right', MulDivOpsRung),
  );
}

export class Sub extends SyntaxTreeNode {
  left!: MulDivOpsOrLower;
  right!: MulDivOpsOrLower;
  
  static rule = new Caten(
    new Match(false, 'left', MulDivOpsRung),
    token('-'),
    new Match(false, 'right', MulDivOpsRung),
  );
}

export class Comparison extends SyntaxTreeNode {
  exprs!: AddSubOpsOrLower;
  operators!: MulDivOpsRung;
  
  static rule = new Repeat(
    new Match(true, 'exprs', AddSubOpsRung),
    new Or(
      new Match(true, 'operators', token('<')),
      new Match(true, 'operators', token('<=')),
      new Match(true, 'operators', token('==')),
      new Match(true, 'operators', token('>=')),
      new Match(true, 'operators', token('>')),
    ),
    2,
  );
}

export class Intersection extends SyntaxTreeNode {
  left!: ComparisonOrLower;
  right!: ComparisonOrLower;
  
  static rule = new Caten(
    new Match(false, 'left', ComparisonRung),
    token('&'),
    new Match(false, 'right', ComparisonRung),
  );
}

export class Union extends SyntaxTreeNode {
  left!: IntersectionOrLower;
  right!: IntersectionOrLower;
  
  static rule = new Caten(
    new Match(false, 'left', IntersectionRung),
    token('|'),
    new Match(false, 'right', IntersectionRung),
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
        token('then'),
        new Match(false, 'ifPos', UnionRung),
        token('else'),
        new Match(false, 'ifNeg', UnionRung),
      ),
      new Caten(
        token('thand'),
        new Match(false, 'ifPos', UnionRung),
      ),
      new Caten(
        token('thelse'),
        new Match(false, 'ifNeg', UnionRung),
      ),
    ),
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
matchValueExprRung.match = ExprRung;

matchTypeExprRung0.match = ExprRung;
matchTypeExprRung1.match = ExprRung;
