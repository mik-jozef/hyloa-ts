import { Caten, IdentifierToken, Match, Maybe, Or, Repeat, SyntaxTreeNode } from 'lr-parser-typescript';

import { ModuleAst } from '../../module.js';
import { token } from './tokenizer.js';

const matchValueObjectLiteral = new Match(false, 'value', null!);
const matchValueProcedureCall = new Match(false, 'value', null!);
const matchValueTypeArguments = new Match(false, 'value', null!);
const matchValueMemberAccess = new Match(false, 'value', null!);
const matchValueAwait = new Match(false, 'value', null!);
const matchValueEquals = new Match(false, 'value', null!);
const matchValueComplement = new Match(false, 'value', null!);
const matchValueIntersection = new Match(false, 'value', null!);
const matchValueUnion = new Match(false, 'value', null!);
const matchValueBecomes = new Match(false, 'value', null!);
const matchValueConditional = new Match(false, 'value', null!);
const matchValueAssignment = new Match(false, 'value', null!);
const matchValueReturn = new Match(false, 'value', null!);
const matchValueUniversalQuantifier = new Match(false, 'value', null!);
const matchValueExistentialQuantifier = new Match(false, 'value', null!);
const matchValueLetDeclaration = new Match(false, 'value', null!);
const matchValueExprRung = new Match(false, 'value', null!);

type BottomExprs =
  | ObjectLiteral
  | IdentifierToken
  | ProcedureCall
  | TypeArguments
  | MemberAccess
;

export class BottomRung extends SyntaxTreeNode {
  static hidden = true;
  
  static rule = new Or(
    matchValueObjectLiteral,
    new Match(false, 'value', token('identifier')),
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
  | Await
  | BottomExprs
;

export class LeftUnaryOpsRung extends SyntaxTreeNode {
  static hidden = true;
  
  static rule = new Or(
    matchValueAwait,
    new Match( false, 'value', BottomRung ),
  );
}

export type EqualsOrLower =
  | Equals
  | LeftUnaryOpsOrLower
;

export class EqualsRung extends SyntaxTreeNode {
  static hidden = true;
  
  static rule = new Or(
    matchValueEquals,
    new Match(false, 'value', LeftUnaryOpsRung),
  );
}

export type ComplementOrLower =
  | Complement
  | EqualsOrLower
;

export class ComplementRung extends SyntaxTreeNode {
  static hidden = true;
  
  static rule = new Or(
    matchValueComplement,
    new Match(false, 'value', EqualsRung),
  );
}

export type IntersectionOrLower =
  | Intersection
  | ComplementOrLower
;

export class IntersectionRung extends SyntaxTreeNode {
  static hidden = true;
  
  static rule = new Or(
    matchValueIntersection,
    new Match(false, 'value', ComplementRung),
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

export type ConditionalOrLower =
  | Conditional
  | BecomesOrLower
;

export class ConditionalRung extends SyntaxTreeNode {
  static hidden = true;
  
  static rule = new Or(
    matchValueConditional,
    matchValueAssignment,
    new Match(false, 'value', BecomesRung),
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
    matchValueUniversalQuantifier,
    matchValueExistentialQuantifier,
    matchValueLetDeclaration,
    new Match(false, 'value', ConditionalRung),
  );
}

// End of the ladder.

class LetDeclarationParameter extends SyntaxTreeNode {
  name!: IdentifierToken;
  defaultArg!: Expr;
  type!: Expr;
  
  static rule: Caten = new Caten(
    new Match(false, 'name', token('identifier')),
    new Maybe(
      new Caten(
        token(':'),
        new Match(false, 'type', ExprRung),
      ),
    ),
    new Maybe(
      new Caten(
        token(':='),
        new Match(false, 'defaultArg', ExprRung),
      ),
    ),
  );
}

export class LetDeclaration extends SyntaxTreeNode {
  name!: IdentifierToken | null;
  params!: LetDeclarationParameter[];
  type!: Expr;
  body!: Expr;
  
  static rule: Caten = new Caten(
    token('let'),
    new Maybe(new Match(false, 'name', token('identifier'))),
    
    new Maybe(
      new Caten(
        token('('),
        new Repeat(new Match(true, 'params', LetDeclarationParameter), {
          delimiter: token(','),
          trailingDelimiter: true,
        }),
        token(')'),
      ),
    ),
    
    new Maybe(
      new Caten(
        token(':'),
        new Match(false, 'type', ExprRung),
      ),
    ),
    
    new Or(
      new Caten(
        token(':='),
        new Match(true, 'body', ExprRung),
      ),
      new Caten(
        token('{'),
        new Repeat(
          new Match(true, 'body', ExprRung),
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

export class MemberAccess extends SyntaxTreeNode {
  expr!: BottomExprs;
  memberName!: IdentifierToken;
  
  static rule = new Caten(
    new Match(false, 'expr', BottomRung),
    token('.'),
    new Match(false, 'memberName', token('identifier')),
  );
}

export class Await extends SyntaxTreeNode {
  expr!: LeftUnaryOpsOrLower;
  
  static rule = new Caten(
    token('await'),
    new Match(false, 'expr', LeftUnaryOpsRung),
  );
}

export class Equals extends SyntaxTreeNode {
  left!: LeftUnaryOpsOrLower;
  rite!: LeftUnaryOpsOrLower;
  
  static rule = new Caten(
    new Match(false, 'left', LeftUnaryOpsRung),
    token('=='),
    new Match(false, 'rite', LeftUnaryOpsRung),
  );
}

export class Complement extends SyntaxTreeNode {
  expr!: ComplementOrLower;
  
  static rule = new Caten(
    token('~'),
    new Match(false, 'expr', ComplementRung),
  );
}

export class Intersection extends SyntaxTreeNode {
  left!: IntersectionOrLower;
  rite!: LeftUnaryOpsOrLower;
  
  static rule = new Caten(
    new Match(false, 'left', IntersectionRung),
    token('&'),
    new Match(false, 'rite', ComplementRung),
  );
}

export class Union extends SyntaxTreeNode {
  left!: UnionOrLower;
  rite!: IntersectionOrLower;
  
  static rule = new Caten(
    new Match(false, 'left', UnionRung),
    token('|'),
    new Match(false, 'rite', IntersectionRung),
  );
}

export class Becomes extends SyntaxTreeNode {
  left!: UnionOrLower;
  rite!: UnionOrLower;
  
  static rule = new Caten(
    new Match(false, 'left', UnionRung),
    token('>>'),
    new Match(false, 'rite', UnionRung),
  );
}

export class Conditional extends SyntaxTreeNode {
  conditional!: BecomesOrLower;
  ifPos!: Expr | null;
  ifNeg!: ConditionalOrLower | null;
  
  static rule = new Caten(
    new Match(false, 'cond', BecomesRung),
    token('then'),
    new Match(false, 'ifPos', ExprRung),
    token('else'),
    new Match(false, 'ifNeg', ConditionalRung),
  );
}

export class Assignment extends SyntaxTreeNode {
  left!: UnionOrLower;
  rite!: LeftUnaryOpsOrLower;
  
  static rule: Caten = new Caten(
    new Match(false, 'left', UnionRung),
    token('<<'),
    new Match(false, 'rite', LeftUnaryOpsRung),
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

matchValueObjectLiteral.match = ObjectLiteral;
matchValueProcedureCall.match = ProcedureCall;
matchValueMemberAccess.match = MemberAccess;
matchValueTypeArguments.match = TypeArguments;
matchValueAwait.match = Await;
matchValueEquals.match = Equals;
matchValueComplement.match = Complement;
matchValueIntersection.match = Intersection;
matchValueUnion.match = Union;
matchValueBecomes.match = Becomes;
matchValueConditional.match = Conditional;
matchValueAssignment.match = Assignment;
matchValueReturn.match = Return;
matchValueUniversalQuantifier.match = UniversalQuantifier;
matchValueExistentialQuantifier.match = ExistentialQuantifier;
matchValueLetDeclaration.match = LetDeclaration;
matchValueExprRung.match = ExprRung;


export class SiresModuleAst extends ModuleAst {
  imports = [];
  defs!: LetDeclaration[];

  static rule = new Caten(
    new Repeat(
      new Caten(
        new Match(true, 'defs', LetDeclaration),
        token(';'),
      ),
    ),
  );
}
