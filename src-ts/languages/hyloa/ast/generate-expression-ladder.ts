/*/
  Note: This is an interesting idea, but let's not get blocked by it.
  Leaving here as a reminder to also try to define this in Hyloa one
  day. If I get a working implementation (without any hacks like type
  casts) that is also able to handle circularities in the grammar,
  I'll know I can be proud of Hyloa's type system.
  
  Conventions:
  
  0. Lowercase type name means the type is expected to be a unit type.
  1. Right is spelled "rite" to have as many characters as left.
/*/

import { Caten, Match, Repeat, SyntaxTreeNode, Token } from "lr-parser-typescript";
import { token, TokenString } from "./tokenizer";


type SyntaxTreeNodeClass = (new (...rest: any[]) => SyntaxTreeNode) & typeof SyntaxTreeNode;

enum Assoc { left, rite, none }

type RiteAssociative = { associates: Assoc.rite };
type LeftAssociative = { associates: Assoc.left };

type Operator = { op: TokenString, name: string };

type BinaryOperator = Operator & { type: 'binary', associates: Assoc };
type StickyOperator = Operator & { type: 'sticky' };
type CustomNode = { type: 'custom', cls: SyntaxTreeNodeClass };

type InPrecedence = BinaryOperator | StickyOperator | CustomNode;

/*/
  Elements of an array have ascending precedence.
  
  If an array A contains an array B, the elements of B are incomparable among
  themselves. If B contains another array C, the elements of C are again
  comparable, and so on.
/*/
type Precedence = InPrecedence | Precedence[];


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

type StickyOperatorNode<
  Op extends string,
  Lower extends SyntaxTreeNode,
> =
  new (...rest: any[]) => (SyntaxTreeNode & {
    operands: Lower[],
    symbols: Token<Op>[],
  });


// TODO also return the rung.
type BinaryOp<
  B extends BinaryOperator,
  Lower extends SyntaxTreeNode,
> =
  B extends LeftAssociative ? BinaryOperatorNode<B['op'], Lower, Lower, any, never> :
  B extends RiteAssociative ? BinaryOperatorNode<B['op'], Lower, Lower, never, any> :
  BinaryOperatorNode<B['op'], Lower, Lower, never, never>
;

type OperatorsArr<PArr extends Precedence[], Lower extends SyntaxTreeNode> =
  PArr extends [ infer P extends Precedence, ...infer Rest extends Precedence[]]
    // TODO NameOf<P>
    ? [ Operators<P, Lower>, OperatorsArr<Rest, Lower | CollectOperators<P, Lower>> ]
    : {}
;

type Operators<P extends Precedence, Lower extends SyntaxTreeNode> =
  P extends BinaryOperator ? BinaryOp<P, Lower> :
  P extends StickyOperator ? StickyOperatorNode<P['op'], Lower> :
  P extends CustomNode ? P :
  P extends Precedence[] ? OperatorsArr<P, Lower> :
  never
;

type CollectOperators<P extends Precedence, Lower extends SyntaxTreeNode> =
  P & Lower & never;

// @ts-ignore
function generateExpressionLadder<
  P extends Precedence,
>(
  precedence: P,
  LowerRung: SyntaxTreeNodeClass,
):
  Operators<P, never>
{
  if (Array.isArray(precedence)) {
    // TODO
    return null as any;
  }
  
  switch (precedence.type) {
    case 'binary': {
      const p = precedence as P & BinaryOperator;
      
      return {
        op: class Op extends SyntaxTreeNode {
          // @ts-ignore
          static name = p.name;
          
          left!: any;
          rite!: any;
          symbol: any;
          
          static rule: Caten = new Caten(
            new Match(false, 'left',
              p.associates === Assoc.left ? Op : LowerRung,
            ),
            token(p.op),
            new Match(false, 'rite',
              p.associates === Assoc.rite ? Op : LowerRung,
            ),
          );
        },
        rung: class Rung {
          // @ts-ignore
          static name = p.name + 'Rung';
          
          
        },
      } as any;
    }
    case 'sticky': {
      const p = precedence as P & StickyOperator;
      
      return class Cls extends SyntaxTreeNode {
        // @ts-ignore
        static name = p.name;
        
        operands!: any;
        symbols: any;
        
        static rule = new Repeat(
          new Match(true, 'operands', LowerRung),
          new Match(true, 'symbols', LowerRung),
        );
      } as any;
    }
    case 'custom':
      return null as any;
  }
}
