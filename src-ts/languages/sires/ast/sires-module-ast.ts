import { Caten, Match, MatchArr, Maybe, Or, Repeat, SyntaxTreeNode } from 'lr-parser-typescript';

import { ModuleAst } from '../../module.js';
import { IdentifierToken } from '../../create-tokenizer.js';


const matchValueObjectLiteral = new Match('value', null!);
const matchValueProcedureCall = new Match('value', null!);
const matchValueTypeArguments = new Match('value', null!);
const matchValueMemberAccess = new Match('value', null!);
const matchValueAwait = new Match('value', null!);
const matchValueComplement = new Match('value', null!);
const matchValueEquals = new Match('value', null!);
const matchValueIntersection = new Match('value', null!);
const matchValueUnion = new Match('value', null!);
const matchValueBecomes = new Match('value', null!);
const matchValueConditional = new Match('value', null!);
const matchValueAssignment = new Match('value', null!);
const matchValueReturn = new Match('value', null!);
const matchValueUniversalQuantifier = new Match('value', null!);
const matchValueExistentialQuantifier = new Match('value', null!);
const matchValueLetDeclaration = new Match('value', null!);
const matchValueExprRung = new Match('value', null!);

type BottomExprs =
  | ObjectLiteral
  | IdentifierToken
  | ProcedureCall
  | TypeArguments
  | MemberAccess
;

export class BottomRung extends SyntaxTreeNode {
  static hidden = true;
  
  static pattern = new Or(
    matchValueObjectLiteral,
    new Match('value', 'identifier'),
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
  | Await
  | Complement
  | BottomExprs
;

export class LeftUnaryOpsRung extends SyntaxTreeNode {
  static hidden = true;
  
  static pattern = new Or(
    matchValueAwait,
    matchValueComplement,
    new Match('value', BottomRung),
  );
}

export type EqualsOrLower =
  | Equals
  | LeftUnaryOpsOrLower
;

export class EqualsRung extends SyntaxTreeNode {
  static hidden = true;
  
  static pattern = new Or(
    matchValueEquals,
    new Match('value', LeftUnaryOpsRung),
  );
}

export type IntersectionOrLower =
  | Intersection
  | EqualsOrLower
;

export class IntersectionRung extends SyntaxTreeNode {
  static hidden = true;
  
  static pattern = new Or(
    matchValueIntersection,
    new Match('value', EqualsRung),
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

export type ConditionalOrLower =
  | Conditional
  | BecomesOrLower
;

export class ConditionalRung extends SyntaxTreeNode {
  static hidden = true;
  
  static pattern = new Or(
    matchValueConditional,
    matchValueAssignment,
    new Match('value', BecomesRung),
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
  
  static pattern = new Or(
    matchValueReturn,
    matchValueUniversalQuantifier,
    matchValueExistentialQuantifier,
    matchValueLetDeclaration,
    new Match('value', ConditionalRung),
  );
}

// End of the ladder.

class LetDeclarationParameter extends SyntaxTreeNode {
  name!: IdentifierToken;
  defaultArg!: Expr;
  type!: Expr;
  
  static pattern: Caten = new Caten(
    new Match('name', 'identifier'),
    new Maybe(
      new Caten(
        ':',
        new Match('type', ExprRung),
      ),
    ),
    new Maybe(
      new Caten(
        ':=',
        new Match('defaultArg', ExprRung),
      ),
    ),
  );
}

export class LetDeclaration extends SyntaxTreeNode {
  name!: IdentifierToken | null;
  params!: LetDeclarationParameter[];
  type!: Expr;
  body!: Expr;
  
  static pattern: Caten = new Caten(
    'let',
    new Maybe(new Match('name', 'identifier')),
    
    new Maybe(
      new Caten(
        '(',
        new Repeat(new MatchArr('params', LetDeclarationParameter), {
          delimiter: ',',
          trailingDelimiter: true,
        }),
        ')',
      ),
    ),
    
    new Maybe(
      new Caten(
        ':',
        new Match('type', ExprRung),
      ),
    ),
    
    new Or(
      new Caten(
        ':=',
        new MatchArr('body', ExprRung),
      ),
      new Caten(
        '{',
        new Repeat(
          new MatchArr('body', ExprRung),
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

export class ProcedureCall extends SyntaxTreeNode {
  procedure!: BottomExprs;
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
  expr!: BottomExprs;
  memberName!: IdentifierToken;
  
  static pattern = new Caten(
    new Match('expr', BottomRung),
    '.',
    new Match('memberName', 'identifier'),
  );
}

export class Await extends SyntaxTreeNode {
  expr!: LeftUnaryOpsOrLower;
  
  static pattern = new Caten(
    'await',
    new Match('expr', LeftUnaryOpsRung),
  );
}

export class Complement extends SyntaxTreeNode {
  expr!: LeftUnaryOpsOrLower;
  
  static pattern = new Caten(
    '~',
    new Match('expr', LeftUnaryOpsRung),
  );
}

export class Equals extends SyntaxTreeNode {
  left!: LeftUnaryOpsOrLower;
  rite!: LeftUnaryOpsOrLower;
  
  static pattern = new Caten(
    new Match('left', LeftUnaryOpsRung),
    '===',
    new Match('rite', LeftUnaryOpsRung),
  );
}

export class Intersection extends SyntaxTreeNode {
  left!: IntersectionOrLower;
  rite!: EqualsRung;
  
  static pattern = new Caten(
    new Match('left', IntersectionRung),
    '&',
    new Match('rite', EqualsRung),
  );
}

export class Union extends SyntaxTreeNode {
  left!: UnionOrLower;
  rite!: IntersectionOrLower;
  
  static pattern = new Caten(
    new Match('left', UnionRung),
    '|',
    new Match('rite', IntersectionRung),
  );
}

export class Becomes extends SyntaxTreeNode {
  left!: UnionOrLower;
  rite!: UnionOrLower;
  
  static pattern = new Caten(
    new Match('left', UnionRung),
    '>>',
    new Match('rite', UnionRung),
  );
}

export class Conditional extends SyntaxTreeNode {
  conditional!: BecomesOrLower;
  ifPos!: Expr | null;
  ifNeg!: ConditionalOrLower | null;
  
  static pattern = new Caten(
    new Match('cond', BecomesRung),
    'then',
    new Match('ifPos', ExprRung),
    'else',
    new Match('ifNeg', ConditionalRung),
  );
}

export class Assignment extends SyntaxTreeNode {
  left!: UnionOrLower;
  rite!: LeftUnaryOpsOrLower;
  
  static pattern: Caten = new Caten(
    new Match('left', UnionRung),
    '<<',
    new Match('rite', LeftUnaryOpsRung),
  );
}

export class Return extends SyntaxTreeNode {
  expr!: Expr;
  
  static pattern: Caten = new Caten(
    'return',
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

matchValueObjectLiteral.match = ObjectLiteral;
matchValueProcedureCall.match = ProcedureCall;
matchValueMemberAccess.match = MemberAccess;
matchValueTypeArguments.match = TypeArguments;
matchValueAwait.match = Await;
matchValueComplement.match = Complement;
matchValueEquals.match = Equals;
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

  static pattern = new Caten(
    new Repeat(
      new Caten(
        new MatchArr('defs', LetDeclaration),
        ';',
      ),
    ),
  );
}
