import {
  Caten,
  Match,
  MatchArr,
  Maybe,
  Or,
  Repeat,
  SyntaxTreeNode,
  Token
} from "lr-parser-typescript";

import { ClassLiteral, matchTypeExprRung as matchTypeExprRung0 } from "./class-literal.js";
import { matchMembersDestructuredMembers } from "./hyloa-import-ast.js";
import {
  LetDeclaration,
  matchBodyExprRung,
  matchDefaultArgExprRung,
  matchTypeDestructuredMembers as matchTypeDestructuredMembers1,
  matchTypeExprRung as matchTypeExprRung1,
} from "./let-declaration.js";
import { IdentifierToken, NumberToken, StringToken } from "../../create-tokenizer.js";


// TODO yield

const matchValueClassLiteral = new Match('value', null!);
const matchValueObjectLiteral = new Match('value', null!);
//const matchValueArrayLiteral = new Match('value', null!);
const matchValueProcedureCall = new Match('value', null!);
const matchValueTypeArguments = new Match('value', null!);
const matchValueMemberAccess = new Match('value', null!);
const matchValueNegation = new Match('value', null!);
const matchValueInverse = new Match('value', null!);
const matchValueAwait = new Match('value', null!);
const matchValueNowait = new Match('value', null!);
const matchValueComplement = new Match('value', null!);
const matchValueLeftUnaryPrefix = new Match('value', null!);
const matchValueMul = new Match('value', null!);
const matchValueDiv = new Match('value', null!);
const matchValueAdd = new Match('value', null!);
const matchValueSub = new Match('value', null!);
const matchValueEquals = new Match('value', null!);
const matchValueNotEquals = new Match('value', null!);
const matchValueAndExpr = new Match('value', null!);
const matchValueOrExpr = new Match('value', null!);
const matchValueComparison = new Match('value', null!);
const matchValueIntersection = new Match('value', null!);
const matchValueUnion = new Match('value', null!);
const matchValueBecomes = new Match('value', null!);
const matchValueWith = new Match('value', null!);
const matchValueConditional = new Match('value', null!);
const matchValueAssignment = new Match('value', null!);
const matchValueReturn = new Match('value', null!);
const matchValueUniversalQuantifier = new Match('value', null!);
const matchValueExistentialQuantifier = new Match('value', null!);
const matchValueExprRung = new Match('value', null!);

export class StringLiteral extends SyntaxTreeNode {
  _TS: 'StringLiteral' = 'StringLiteral'
  
  value!: StringToken;
  
  static pattern = new Match('value', 'text');
}

export class NumberLiteral extends SyntaxTreeNode {
  _TS: 'NumberLiteral' = 'NumberLiteral'
  
  value!: NumberToken;
  
  static pattern = new Match('value', 'number');
}

export class TextLiteral extends SyntaxTreeNode {
  _TS: 'TextLiteral' = 'TextLiteral'
  
  static pattern = new Or(); // TODO
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
  
  static pattern = new Or(
    matchValueClassLiteral,
    matchValueObjectLiteral,
    //matchValueArrayLiteral,
    new Match('value', StringLiteral),
    new Match('value', TextLiteral),
    new Match('value', NumberLiteral),
    new Match('value', 'identifier'),
    new Match('value', 'null'),
    new Match('value', 'undefined'),
    new Match('value', 'true'),
    new Match('value', 'false'),
    matchValueProcedureCall,
    matchValueTypeArguments,
    matchValueMemberAccess,
    new Caten(
      '(',
      matchValueExprRung,
      ')',
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
  
  static pattern = new Or(
    matchValueNegation,
    matchValueInverse,
    matchValueAwait,
    matchValueNowait,
    matchValueComplement,
    matchValueLeftUnaryPrefix,
    new Match('value', BottomRung),
  );
}

type MulDivOpsOrLower =
  | Mul
  | Div
  | LeftUnaryOpsOrLower
;

export class MulDivOpsRung extends SyntaxTreeNode {
  static hidden = true;
  
  static pattern = new Or(
    matchValueMul,
    matchValueDiv,
    new Match('value', LeftUnaryOpsRung),
  );
}

type AddSubOpsOrLower =
  | Add
  | Sub
  | MulDivOpsOrLower
;

export class AddSubOpsRung extends SyntaxTreeNode {
  static hidden = true;
  
  static pattern = new Or(
    matchValueAdd,
    matchValueSub,
    new Match('value', MulDivOpsRung),
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
  
  static pattern = new Or(
    matchValueEquals,
    matchValueNotEquals,
    matchValueComparison,
    new Match('value', AddSubOpsRung),
  );
}

export type AndExprOrLower =
  | AndExpr
  | ComparisonOrLower
  ;

export class AndExprRung extends SyntaxTreeNode {
  static hidden = true;
  
  static pattern = new Or(
    matchValueAndExpr,
    new Match('value', ComparisonRung),
  );
}

export type OrExprOrLower =
  | OrExpr
  | AndExprOrLower
  ;

export class OrExprRung extends SyntaxTreeNode {
  static hidden = true;
  
  static pattern = new Or(
    matchValueOrExpr,
    new Match('value', AndExprRung),
  );
}

export type IntersectionOrLower =
  | Intersection
  | OrExprOrLower
;

export class IntersectionRung extends SyntaxTreeNode {
  static hidden = true;
  
  static pattern = new Or(
    matchValueIntersection,
    new Match('value', OrExprRung),
  );
}

export type UnionOrLower =
  | Union
  | IntersectionOrLower
;

export class UnionRung extends SyntaxTreeNode {
  static hidden = true;
  
  static pattern = new Or(
    matchValueUnion,
    new Match('value', IntersectionRung),
  );
}

export type BecomesOrLower =
  | Becomes
  | UnionOrLower
;

export class BecomesRung extends SyntaxTreeNode {
  static hidden = true;
  
  static pattern = new Or(
    matchValueBecomes,
    new Match('value', UnionRung),
  );
}

export type WithOrLower =
  | With
  | BecomesOrLower
;

export class WithRung extends SyntaxTreeNode {
  static hidden = true;
  
  static pattern = new Or(
    matchValueWith,
    new Match('value', BecomesRung),
  );
}

export type ConditionalOrLower =
  | Conditional
  | WithOrLower
;

export class ConditionalRung extends SyntaxTreeNode {
  static hidden = true;
  
  static pattern = new Or(
    matchValueConditional,
    matchValueAssignment,
    new Match('value', WithRung),
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
  
  static pattern = new Or(
    matchValueReturn,
    matchValueUniversalQuantifier,
    matchValueExistentialQuantifier,
    new Match('value', LetDeclaration),
    new Match('value', ConditionalRung),
  );
}

// End of the ladder.

class ObjectProperty extends SyntaxTreeNode {
  name!: IdentifierToken;
  value!: Expr;
  
  static pattern = new Caten(
    new Match('name', 'identifier'),
    ':',
    new Match('value', ExprRung),
  );
}

export class ObjectLiteral extends SyntaxTreeNode {
  properties!: ObjectProperty[];
  
  static pattern = new Caten(
    '{',
    new Repeat(new MatchArr('properties', ObjectProperty), {
      delimiter: ',',
      trailingDelimiter: true,
    }),
    '}',
  );
}

/* TODO delete? Let's rather use `Array(0, 1, 2)` instead of `[0, 1, 2]`
// Also not that I care, but including array literas swells the parser
// table by *so much* I cannnot believe it :O was ist goin on
export class ArrayLiteral extends SyntaxTreeNode {
  elements!: Expr[];
  
  static pattern = new Caten(
    token('['),
    new Repeat(new MatchArr('elements', ExprRung), {
      delimiter: token(','),
      trailingDelimiter: true,
    }),
    token(']'),
  );
}*/

export class ProcedureCall extends SyntaxTreeNode {
  procedure!: Expr;
  args!: Expr[];
  
  static pattern = new Caten(
    new Match('procedure', BottomRung),
    '(',
    new Repeat(new MatchArr('args', ExprRung), {
      delimiter: ',',
      trailingDelimiter: true,
    }),
    ')',
  );
}

export class TypeArguments extends SyntaxTreeNode {
  _TS: 'TypeArguments' = 'TypeArguments'
  
  expr!: Expr;
  args!: Expr[];
  
  static pattern = new Caten(
    new Match('expr', BottomRung),
    '[',
    new Repeat(new MatchArr('args', ExprRung), {
      delimiter: ',',
      trailingDelimiter: true,
    }),
    ']',
  );
}

export class MemberAccess extends SyntaxTreeNode {
  expr!: Expr;
  op!: Token<'.'> | Token<'?.'>
  memberName!: IdentifierToken;
  
  static pattern = new Caten(
    new Match('expr', BottomRung),
    new Or(
      new Match('op', '.'),
      new Match('op', '?.'),
    ),
    new Match('memberName', 'identifier'),
  );
}

export class Negation extends SyntaxTreeNode {
  expr!: Expr;
  
  static pattern = new Caten(
    '!',
    new Match('expr', LeftUnaryOpsRung),
  );
}

export class Inverse extends SyntaxTreeNode {
  expr!: Expr;
  
  static pattern = new Caten(
    '-',
    new Match('expr', LeftUnaryOpsRung),
  );
}

export class Await extends SyntaxTreeNode {
  expr!: Expr;
  
  static pattern = new Caten(
    'await',
    new Match('expr', LeftUnaryOpsRung),
  );
}

export class Nowait extends SyntaxTreeNode {
  expr!: Expr;
  
  static pattern = new Caten(
    'nowait',
    new Match('expr', LeftUnaryOpsRung),
  );
}

export class Complement extends SyntaxTreeNode {
  expr!: Expr;
  
  static pattern = new Caten(
    '~',
    new Match('expr', LeftUnaryOpsRung),
  );
}

export class LeftUnaryPrefix extends SyntaxTreeNode {
  expr!: Expr;
  token!: Token<'|'> | Token<'&'>;
  
  static pattern = new Caten(
    new Or(
      new Match('token', '|'),
      new Match('token', '&'),
    ),
    new Match('expr', LeftUnaryOpsRung),
  );
}

export class Mul extends SyntaxTreeNode {
  left!: Expr;
  rite!: Expr;
  
  static pattern = new Caten(
    new Match('left', LeftUnaryOpsRung),
    '*',
    new Match('rite', LeftUnaryOpsRung),
  );
}

export class Div extends SyntaxTreeNode {
  left!: Expr;
  rite!: Expr;
  
  static pattern = new Caten(
    new Match('left', LeftUnaryOpsRung),
    '/',
    new Match('rite', LeftUnaryOpsRung),
  );
}

export class Add extends SyntaxTreeNode {
  left!: Expr;
  rite!: Expr;
  
  static pattern = new Caten(
    new Match('left', MulDivOpsRung),
    '+',
    new Match('rite', MulDivOpsRung),
  );
}

export class Sub extends SyntaxTreeNode {
  left!: Expr;
  rite!: Expr;
  
  static pattern = new Caten(
    new Match('left', MulDivOpsRung),
    '-',
    new Match('rite', MulDivOpsRung),
  );
}

export class Equals extends SyntaxTreeNode {
  exprs!: Expr[];
  
  static pattern = new Repeat(
    new MatchArr('exprs', AddSubOpsRung),
    {
      delimiter: '===',
      lowerBound: 2,
    },
  );
}

export class NotEquals extends SyntaxTreeNode {
  left!: Expr;
  rite!: Expr;
  
  static pattern = new Caten(
    new Match('left', AddSubOpsRung),
    '!==',
    new Match('rite', AddSubOpsRung),
  );
}

export class Comparison extends SyntaxTreeNode {
  exprs!: Expr[];
  operators!: (Token<'<'> | Token<'<='> | Token<'=='> | Token<'!='>)[];
  
  static pattern = new Repeat(new MatchArr('exprs', AddSubOpsRung), {
    delimiter: new Or(
      new MatchArr('operators', '<'),
      new MatchArr('operators', '<='),
      new MatchArr('operators', '=='),
      new MatchArr('operators', '!='), // TODO make it a separate operator?
    ),
    lowerBound: 2,
  });
}

export class AndExpr extends SyntaxTreeNode {
  left!: Expr;
  rite!: Expr;
  
  static pattern = new Caten(
    new Match('left', ComparisonRung),
    '&&',
    new Match('rite', AndExprRung),
  );
}

export class OrExpr extends SyntaxTreeNode {
  left!: Expr;
  rite!: Expr;
  
  static pattern = new Caten(
    new Match('left', AndExprRung),
    '||',
    new Match('rite', OrExprRung),
  );
}

export class Intersection extends SyntaxTreeNode {
  left!: Expr;
  rite!: Expr;
  
  static pattern = new Caten(
    new Match('left', IntersectionRung),
    '&',
    new Match('rite', ComparisonRung),
  );
}

export class Union extends SyntaxTreeNode {
  left!: Expr;
  rite!: Expr;
  
  static pattern = new Caten(
    new Match('left', UnionRung),
    '|',
    new Match('rite', IntersectionRung),
  );
}

// TODO split into MayBecome `>` and WillBecome `~>`?
export class Becomes extends SyntaxTreeNode {
  left!: Expr;
  rite!: Expr;
  
  static pattern = new Caten(
    new Match('left', UnionRung),
    '>>',
    new Match('rite', UnionRung),
  );
}

const matchTypeDestructuredMembers = new Match('type', null!);

export class DestructuredMember extends SyntaxTreeNode {
  modifier!: Token<'let'> | Token<'asn'> | null;
  name!: IdentifierToken;
  origName!: IdentifierToken | null;
  
  type!: Expr | DestructuredMember | null;
  
  static pattern: Caten = new Caten(
    new Maybe(
      new Caten(
        new Match('origName', 'identifier'),
        'as',
      ),
    ),
    
    new Or( // TODO disallow these in params.
      new Match('modifier', 'let'),
      new Match('modifier', 'asn'),
    ),
    new Match('name', 'identifier'),
    
    new Or(
      new Caten(),
      new Caten(
        ':',
        new Match('type', ExprRung),
      ),
      matchTypeDestructuredMembers,
    ),
  );
}

export class DestructuredMembers extends SyntaxTreeNode {
  members!: DestructuredMember[];
  
  static pattern = new Caten(
    '{',
    new Repeat(
      new MatchArr('members', DestructuredMember),
      {
        delimiter: ',',
        trailingDelimiter: true,
        lowerBound: 1,
      },
    ),
    '}',
  );
}

matchTypeDestructuredMembers.match = DestructuredMembers;

export class With extends SyntaxTreeNode {
  expr!: Expr;
  members!: DestructuredMembers;
  
  static pattern = new Caten(
    new Match('left', BecomesRung),
    'with', // TODO is the keyword necessary?
    new Match('members', DestructuredMembers),
  );
}

export class Conditional extends SyntaxTreeNode {
  cond!: Expr;
  ifPos!: Expr | null;
  ifNeg!: Expr | null;
  
  static pattern = new Caten(
    new Match('cond', WithRung),
    new Or(
      new Caten(
        'then', // Alternatively: ?
        new Match('ifPos', ExprRung),
        'else', // Alternatively: :
        new Match('ifNeg', ConditionalRung),
      ),
      new Caten(
        'thand', // Alternatively: ?.
        new Match('ifPos', ConditionalRung),
      ),
      new Caten(
        'thelse', // Alternatively: ?:
        new Match('ifNeg', ConditionalRung),
      ),
    ),
  );
}

// Alternatives: `<<` (`<<*`) or `<:` (`<:*`) or `asn [left] :=`
// TODO change grammar to?: asn [left]: newType := [rite]
export class Assignment extends SyntaxTreeNode {
  left!: Expr | DestructuredMembers;
  rite!: Expr;
  
  static pattern: Caten = new Caten(
    new Or(
      new Match('left', UnionRung),
      new Match('left', DestructuredMembers),
    ),
    // TODO add param "allowsAssignment" which you set to false, so you
    // can replace this with `:=`.
    '<<',
    new Match('rite', ComparisonRung),
  );
}

export class Return extends SyntaxTreeNode {
  expr!: Expr;
  
  static pattern: Caten = new Caten(
    'return', // TODO `return-foo expr`?
    new Match('expr', ExprRung),
  );
}

export class UniversalQuantifier extends SyntaxTreeNode {
  varName!: IdentifierToken;
  domain!: Expr;
  body!: Expr;
  
  static pattern: Caten = new Caten(
    'All',
    new Match('varName', 'identifier'),
    new Maybe(
      new Caten(
        ':',
        new Match('domain', ExprRung),
      ),
    ),
    '..',
    new Match('body', ExprRung),
  );
}

export class ExistentialQuantifier extends SyntaxTreeNode {
  varName!: IdentifierToken;
  domain!: Expr;
  body!: Expr;
  
  static pattern: Caten = new Caten(
    'Ex',
    new Match('varName', 'identifier'),
    new Maybe(
      new Caten(
        ':',
        new Match('domain', ExprRung),
      ),
    ),
    '..',
    new Match('body', ExprRung),
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
