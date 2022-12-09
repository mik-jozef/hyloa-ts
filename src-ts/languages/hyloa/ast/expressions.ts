import { Caten, Match, Or, SyntaxTreeNode, Token } from "lr-parser-typescript";
import { makeClassDeclaration } from "./class-declarations";
import { makeLetDeclaration } from "./let-declarations";
import { token, TokenString } from "./tokenizer";


/*/
  TODO variable assignment:
  - `<<` assigns without any dereference,
  - `<<*` or `<<:` dereferences once and assigns (calls `.assign`)
/*/

type SyntaxTreeNodeClass = (new (...rest: any[]) => SyntaxTreeNode) & typeof SyntaxTreeNode;

enum Assoc { left, rite, none }

type LeftAssociative = { associates: Assoc.left };
type RiteAssociative = { associates: Assoc.rite };

type Operator = { symbol: TokenString, name: string };
type BinaryOperator = Operator & { associates: Assoc };

type BinaryOperatorNode<
  Op extends string,
  Left extends SyntaxTreeNode,
  Rite extends SyntaxTreeNode,
  IsLeftAssoc,
  IsRiteAssoc,
> =
  new (...rest: any[]) => (SyntaxTreeNode & {
    left: Left | (IsLeftAssoc & BinaryOperatorNode<Op, Left, Rite, IsLeftAssoc, IsRiteAssoc>),
    rite: Rite | (IsRiteAssoc & BinaryOperatorNode<Op, Left, Rite, IsLeftAssoc, IsRiteAssoc>),
    symbol: Token<Op>,
  });

type BinaryOp<
  B extends BinaryOperator,
  Lower extends SyntaxTreeNode,
> =
  B extends LeftAssociative ? BinaryOperatorNode<B['symbol'], Lower, Lower, any, never> :
  B extends RiteAssociative ? BinaryOperatorNode<B['symbol'], Lower, Lower, never, any> :
  BinaryOperatorNode<B['symbol'], Lower, Lower, never, never>
;

function binaryOperator<B extends BinaryOperator, Lower extends SyntaxTreeNodeClass>(
  op: B,
  Lower: Lower,
):
  BinaryOp<B, InstanceType<Lower>>
{
  return class Op extends SyntaxTreeNode {
    // @ts-ignore
    static name = op.name;
    
    left!: any;
    rite!: any;
    symbol: any;
    
    static rule: Caten = new Caten(
      new Match(false, 'left',
        op.associates === Assoc.left ? Op : Lower,
      ),
      token(op.symbol),
      new Match(false, 'rite',
        op.associates === Assoc.rite ? Op : Lower,
      ),
    );
  } as any;
}

const matchValueObjectLiteral = new Match(false, 'value', null!);
const matchValueArrayLiteral = new Match(false, 'value', null!);
const matchValueProcedureCall = new Match(false, 'value', null!);
const matchValueMemberAccess = new Match(false, 'value', null!);
const matchValueTypeArguments = new Match(false, 'value', null!);
const matchValueNegation = new Match(false, 'value', null!);
const matchValueInverse = new Match(false, 'value', null!);
const matchValueAwait = new Match(false, 'value', null!);

export class StringLiteral extends SyntaxTreeNode {
  static rule = new Or(); // TODO
}

export class TextLiteral extends SyntaxTreeNode {
  static rule = new Or(); // TODO
}

type BottomExprs =
  | makeClassDeclaration
  | ObjectLiteral
  | ArrayLiteral
  | StringLiteral // Unformatted utf-8 string.
  | TextLiteral // Markdown- (or simillar) formatted text.
  | Token<'class'>
  | Token<'trait'>
  | ProcedureCall
  | MemberAccess
  | TypeArguments
;

export class BottomRung extends SyntaxTreeNode {
  static hidden = true;
  
  static rule = new Or(
    new Match(false, 'value', makeClassDeclaration),
    matchValueObjectLiteral,
    matchValueArrayLiteral,
    new Match(false, 'value', StringLiteral),
    new Match(false, 'value', TextLiteral),
    new Match(false, 'value', token('class')),
    new Match(false, 'value', token('trait')),
    matchValueProcedureCall,
    matchValueMemberAccess,
    matchValueTypeArguments,
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

matchValueObjectLiteral.match = ObjectLiteral;
matchValueArrayLiteral.match = ArrayLiteral;
matchValueProcedureCall.match = ProcedureCall;
matchValueMemberAccess.match = MemberAccess;
matchValueTypeArguments.match = TypeArguments;
matchValueNegation.match = Negation;
matchValueInverse.match = Inverse;
matchValueAwait.match = Await;
matchValue.match = ;