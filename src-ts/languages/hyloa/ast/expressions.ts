import { Caten, IdentifierToken, Match, Maybe, Or, Repeat, SyntaxTreeNode, Token } from "lr-parser-typescript";

import { ClassLiteral, matchTypeExprRung as matchTypeExprRung0 } from "./class-literal.js";
import { matchMembersDestructuredMembers } from "./hyloa-import-ast.js";
import {
  LetDeclaration,
  matchTypeExprRung as matchTypeExprRung1,
  matchBodyExprRung,
  matchDefaultArgExprRung,
  matchTypeDestructuredMembers as matchTypeDestructuredMembers1,
} from "./let-declaration.js";
import { token } from "./tokenizer.js";


const matchValueClassLiteral = new Match(false, 'value', null!);
const matchValueObjectLiteral = new Match(false, 'value', null!);
//const matchValueArrayLiteral = new Match(false, 'value', null!);
const matchValueProcedureCall = new Match(false, 'value', null!);
const matchValueTypeArguments = new Match(false, 'value', null!);
const matchValueMemberAccess = new Match(false, 'value', null!);
const matchValueNegation = new Match(false, 'value', null!);
const matchValueInverse = new Match(false, 'value', null!);
const matchValueAwait = new Match(false, 'value', null!);
const matchValueNowait = new Match(false, 'value', null!);
const matchValueComplement = new Match(false, 'value', null!);
const matchValueLeftUnaryPrefix = new Match(false, 'value', null!);
const matchValueMul = new Match(false, 'value', null!);
const matchValueDiv = new Match(false, 'value', null!);
const matchValueAdd = new Match(false, 'value', null!);
const matchValueSub = new Match(false, 'value', null!);
const matchValueEquals = new Match(false, 'value', null!);
const matchValueNotEquals = new Match(false, 'value', null!);
const matchValueAndExpr = new Match(false, 'value', null!);
const matchValueOrExpr = new Match(false, 'value', null!);
const matchValueComparison = new Match(false, 'value', null!);
const matchValueIntersection = new Match(false, 'value', null!);
const matchValueUnion = new Match(false, 'value', null!);
const matchValueBecomes = new Match(false, 'value', null!);
const matchValueWith = new Match(false, 'value', null!);
const matchValueConditional = new Match(false, 'value', null!);
const matchValueAssignment = new Match(false, 'value', null!);
const matchValueReturn = new Match(false, 'value', null!);
const matchValueUniversalQuantifier = new Match(false, 'value', null!);
const matchValueExistentialQuantifier = new Match(false, 'value', null!);
const matchValueExprRung = new Match(false, 'value', null!);

export class StringLiteral extends SyntaxTreeNode {
  _TS: 'StringLiteral' = 'StringLiteral'
  
  static rule = token('text');
}

export class NumberLiteral extends SyntaxTreeNode {
  _TS: 'NumberLiteral' = 'NumberLiteral'
  
  static rule = token('number');
}

export class TextLiteral extends SyntaxTreeNode {
  _TS: 'TextLiteral' = 'TextLiteral'
  
  static rule = new Or(); // TODO
}

type BottomExpr =
  | ClassLiteral
  | ObjectLiteral
  //| ArrayLiteral
  | StringLiteral // Unformatted utf-8 string.
  | TextLiteral // Markdown (or simillarly) formatted text.
  | NumberLiteral
  | IdentifierToken
  | Token<'null'>
  | Token<'undefined'>
  | Token<'true'>
  | Token<'false'>
  | ProcedureCall
  | TypeArguments
  | MemberAccess
;

export class BottomRung extends SyntaxTreeNode {
  static hidden = true;
  
  static rule = new Or(
    matchValueClassLiteral,
    matchValueObjectLiteral,
    //matchValueArrayLiteral,
    new Match(false, 'value', StringLiteral),
    new Match(false, 'value', TextLiteral),
    new Match(false, 'value', NumberLiteral),
    new Match(false, 'value', token('identifier')),
    new Match(false, 'value', token('null')),
    new Match(false, 'value', token('undefined')),
    new Match(false, 'value', token('true')),
    new Match(false, 'value', token('false')),
    matchValueProcedureCall,
    matchValueTypeArguments,
    matchValueMemberAccess,
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
  | LeftUnaryPrefix
  | BottomExpr
;

export class LeftUnaryOpsRung extends SyntaxTreeNode {
  static hidden = true;
  
  static rule = new Or(
    matchValueNegation,
    matchValueInverse,
    matchValueAwait,
    matchValueNowait,
    matchValueComplement,
    matchValueLeftUnaryPrefix,
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
  | Equals
  | NotEquals
  | AddSubOpsOrLower
;

export class ComparisonRung extends SyntaxTreeNode {
  static hidden = true;
  
  static rule = new Or(
    matchValueEquals,
    matchValueNotEquals,
    matchValueComparison,
    new Match(false, 'value', AddSubOpsRung),
  );
}

export type AndExprOrLower =
  | AndExpr
  | ComparisonOrLower
  ;

export class AndExprRung extends SyntaxTreeNode {
  static hidden = true;
  
  static rule = new Or(
    matchValueAndExpr,
    new Match(false, 'value', ComparisonRung),
  );
}

export type OrExprOrLower =
  | OrExpr
  | AndExprOrLower
  ;

export class OrExprRung extends SyntaxTreeNode {
  static hidden = true;
  
  static rule = new Or(
    matchValueOrExpr,
    new Match(false, 'value', AndExprRung),
  );
}

export type IntersectionOrLower =
  | Intersection
  | OrExprOrLower
;

export class IntersectionRung extends SyntaxTreeNode {
  static hidden = true;
  
  static rule = new Or(
    matchValueIntersection,
    new Match(false, 'value', OrExprRung),
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

export type BecomesOrLower =
  | Becomes
  | UnionOrLower
;

export class BecomesRung extends SyntaxTreeNode {
  static hidden = true;
  
  static rule = new Or(
    matchValueBecomes,
    new Match(false, 'value', UnionRung),
  );
}

export type WithOrLower =
  | With
  | BecomesOrLower
;

export class WithRung extends SyntaxTreeNode {
  static hidden = true;
  
  static rule = new Or(
    matchValueWith,
    new Match(false, 'value', BecomesRung),
  );
}

export type ConditionalOrLower =
  | Conditional
  | WithOrLower
;

export class ConditionalRung extends SyntaxTreeNode {
  static hidden = true;
  
  static rule = new Or(
    matchValueConditional,
    matchValueAssignment,
    new Match(false, 'value', WithRung),
  );
}

export type Expr =
  | Return
  | UniversalQuantifier
  | ExistentialQuantifier
  | LetDeclaration
  // TODO: | ProcedureType
  | ConditionalOrLower
;

export class ExprRung extends SyntaxTreeNode {
  static hidden = true;
  
  static rule = new Or(
    matchValueReturn,
    matchValueUniversalQuantifier,
    matchValueExistentialQuantifier,
    new Match(false, 'value', LetDeclaration),
    new Match(false, 'value', ConditionalRung),
  );
}

// End of the ladder.

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

/* TODO delete? Let's rather use `Array(0, 1, 2)` instead of `[0, 1, 2]`
// Also not that I care, but including array literas swells the parser
// table by *so much* I cannnot believe it :O was ist goin on
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
}*/

export class ProcedureCall extends SyntaxTreeNode {
  procedure!: Expr;
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

export class TypeArguments extends SyntaxTreeNode {
  _TS: 'TypeArguments' = 'TypeArguments'
  
  expr!: Expr;
  args!: Expr[];
  
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

export class MemberAccess extends SyntaxTreeNode {
  expr!: Expr;
  op!: Token<'.'> | Token<'?.'>
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

export class Negation extends SyntaxTreeNode {
  expr!: Expr;
  
  static rule = new Caten(
    token('!'),
    new Match(false, 'expr', LeftUnaryOpsRung),
  );
}

export class Inverse extends SyntaxTreeNode {
  expr!: Expr;
  
  static rule = new Caten(
    token('-'),
    new Match(false, 'expr', LeftUnaryOpsRung),
  );
}

export class Await extends SyntaxTreeNode {
  expr!: Expr;
  
  static rule = new Caten(
    token('await'),
    new Match(false, 'expr', LeftUnaryOpsRung),
  );
}

export class Nowait extends SyntaxTreeNode {
  expr!: Expr;
  
  static rule = new Caten(
    token('nowait'),
    new Match(false, 'expr', LeftUnaryOpsRung),
  );
}

export class Complement extends SyntaxTreeNode {
  expr!: Expr;
  
  static rule = new Caten(
    token('~'),
    new Match(false, 'expr', LeftUnaryOpsRung),
  );
}

export class LeftUnaryPrefix extends SyntaxTreeNode {
  expr!: Expr;
  token!: Token<'|'> | Token<'&'>;
  
  static rule = new Caten(
    new Or(
      new Match(false, 'token', token('|')),
      new Match(false, 'token', token('&')),
    ),
    new Match(false, 'expr', LeftUnaryOpsRung),
  );
}

export class Mul extends SyntaxTreeNode {
  left!: Expr;
  rite!: Expr;
  
  static rule = new Caten(
    new Match(false, 'left', LeftUnaryOpsRung),
    token('*'),
    new Match(false, 'rite', LeftUnaryOpsRung),
  );
}

export class Div extends SyntaxTreeNode {
  left!: Expr;
  rite!: Expr;
  
  static rule = new Caten(
    new Match(false, 'left', LeftUnaryOpsRung),
    token('/'),
    new Match(false, 'rite', LeftUnaryOpsRung),
  );
}

export class Add extends SyntaxTreeNode {
  left!: Expr;
  rite!: Expr;
  
  static rule = new Caten(
    new Match(false, 'left', MulDivOpsRung),
    token('+'),
    new Match(false, 'rite', MulDivOpsRung),
  );
}

export class Sub extends SyntaxTreeNode {
  left!: Expr;
  rite!: Expr;
  
  static rule = new Caten(
    new Match(false, 'left', MulDivOpsRung),
    token('-'),
    new Match(false, 'rite', MulDivOpsRung),
  );
}

export class Equals extends SyntaxTreeNode {
  exprs!: Expr[];
  
  static rule = new Repeat(
    new Match(true, 'exprs', AddSubOpsRung),
    {
      delimiter: token('==='),
      lowerBound: 2,
    },
  );
}

export class NotEquals extends SyntaxTreeNode {
  left!: Expr;
  rite!: Expr;
  
  static rule = new Caten(
    new Match(false, 'left', AddSubOpsRung),
    token('!=='),
    new Match(false, 'rite', AddSubOpsRung),
  );
}

export class Comparison extends SyntaxTreeNode {
  exprs!: Expr[];
  operators!: (Token<'<'> | Token<'<='> | Token<'=='> | Token<'!='>)[];
  
  static rule = new Repeat(new Match(true, 'exprs', AddSubOpsRung), {
    delimiter: new Or(
      new Match(true, 'operators', token('<')),
      new Match(true, 'operators', token('<=')),
      new Match(true, 'operators', token('==')),
      new Match(true, 'operators', token('!=')), // TODO make it a separate operator?
    ),
    lowerBound: 2,
  });
}

export class AndExpr extends SyntaxTreeNode {
  left!: Expr;
  rite!: Expr;
  
  static rule = new Caten(
    new Match(false, 'left', ComparisonRung),
    token('&&'),
    new Match(false, 'rite', AndExprRung),
  );
}

export class OrExpr extends SyntaxTreeNode {
  left!: Expr;
  rite!: Expr;
  
  static rule = new Caten(
    new Match(false, 'left', AndExprRung),
    token('||'),
    new Match(false, 'rite', OrExprRung),
  );
}

export class Intersection extends SyntaxTreeNode {
  left!: Expr;
  rite!: Expr;
  
  static rule = new Caten(
    new Match(false, 'left', IntersectionRung),
    token('&'),
    new Match(false, 'rite', ComparisonRung),
  );
}

export class Union extends SyntaxTreeNode {
  left!: Expr;
  rite!: Expr;
  
  static rule = new Caten(
    new Match(false, 'left', UnionRung),
    token('|'),
    new Match(false, 'rite', IntersectionRung),
  );
}

// TODO split into MayBecome `>` and WillBecome `~>`?
export class Becomes extends SyntaxTreeNode {
  left!: Expr;
  rite!: Expr;
  
  static rule = new Caten(
    new Match(false, 'left', UnionRung),
    token('>>'),
    new Match(false, 'rite', UnionRung),
  );
}

const matchTypeDestructuredMembers = new Match(false, 'type', null!);

export class DestructuredMember extends SyntaxTreeNode {
  modifier!: Token<'let'> | Token<'asn'> | null;
  name!: IdentifierToken;
  origName!: IdentifierToken | null;
  
  type!: Expr | DestructuredMember | null;
  
  static rule: Caten = new Caten(
    new Maybe(
      new Caten(
        new Match(false, 'origName', token('identifier')),
        token('as'),
      ),
    ),
    
    new Or( // TODO disallow these in params.
      new Match(false, 'modifier', token('let')),
      new Match(false, 'modifier', token('asn')),
    ),
    new Match(false, 'name', token('identifier')),
    
    new Or(
      new Caten(),
      new Caten(
        token(':'),
        new Match(false, 'type', ExprRung),
      ),
      matchTypeDestructuredMembers,
    ),
  );
}

export class DestructuredMembers extends SyntaxTreeNode {
  members!: DestructuredMember[];
  
  static rule = new Caten(
    token('{'),
    new Repeat(
      new Match(true, 'members', DestructuredMember),
      {
        delimiter: token(','),
        trailingDelimiter: true,
        lowerBound: 1,
      },
    ),
    token('}'),
  );
}

matchTypeDestructuredMembers.match = DestructuredMembers;

export class With extends SyntaxTreeNode {
  expr!: Expr;
  members!: DestructuredMembers;
  
  static rule = new Caten(
    new Match(false, 'left', BecomesRung),
    token('with'),
    new Match(false, 'members', DestructuredMembers),
  );
}

export class Conditional extends SyntaxTreeNode {
  condition!: Expr;
  ifPos!: Expr | null;
  ifNeg!: Expr | null;
  
  static rule = new Caten(
    new Match(false, 'cond', WithRung),
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

// Alternatives: `<<` (`<<*`) or `<:` (`<:*`) or `asn [left] :=`
// TODO change grammar to?: asn [left]: newType := [rite]
export class Assignment extends SyntaxTreeNode {
  left!: Expr | DestructuredMembers;
  rite!: Expr;
  
  static rule: Caten = new Caten(
    new Or(
      new Match(false, 'left', UnionRung),
      new Match(false, 'left', DestructuredMembers),
    ),
    // TODO add param "allowsAssignment" which you set to false, so you
    // can replace this with `:=`.
    token('<<'),
    new Match(false, 'rite', ComparisonRung),
  );
}

export class Return extends SyntaxTreeNode {
  expr!: Expr;
  
  static rule: Caten = new Caten(
    token('return'), // TODO `return-foo expr`?
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
//matchValueArrayLiteral.match = ArrayLiteral;
matchValueProcedureCall.match = ProcedureCall;
matchValueMemberAccess.match = MemberAccess;
matchValueTypeArguments.match = TypeArguments;
matchValueNegation.match = Negation;
matchValueInverse.match = Inverse;
matchValueAwait.match = Await;
matchValueNowait.match = Nowait;
matchValueComplement.match = Complement;
matchValueLeftUnaryPrefix.match = LeftUnaryPrefix;
matchValueMul.match = Mul;
matchValueDiv.match = Div;
matchValueAdd.match = Add;
matchValueSub.match = Sub;
matchValueEquals.match = Equals;
matchValueNotEquals.match = NotEquals;
matchValueAndExpr.match = AndExpr;
matchValueOrExpr.match = OrExpr;
matchValueComparison.match = Comparison;
matchValueIntersection.match = Intersection;
matchValueUnion.match = Union;
matchValueBecomes.match = Becomes;
matchValueWith.match = With;
matchValueConditional.match = Conditional;
matchValueAssignment.match = Assignment;
matchValueReturn.match = Return;
matchValueUniversalQuantifier.match = UniversalQuantifier;
matchValueExistentialQuantifier.match = ExistentialQuantifier;
matchValueExprRung.match = ExprRung;

matchMembersDestructuredMembers.match = DestructuredMembers;
matchTypeDestructuredMembers1.match = DestructuredMembers;
matchTypeExprRung0.match = ExprRung;
matchTypeExprRung1.match = ExprRung;
matchBodyExprRung.match = ExprRung;
matchDefaultArgExprRung.match = ExprRung;
