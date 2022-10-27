import { Caten, Match, MergedTokens, Or, Repeat, SyntaxTreeNode as syntaxTreeNodes, Token } from "lr-parser-typescript";

import { token } from "./tokenizer.js";


type ImportRest = importsRest;
class importsRest extends syntaxTreeNodes {
  rest!: importsRest | null;
  
  static rule: Or = new Or(
    new Caten(),
    token('identifier'),
    new Caten(
      token('identifier'),
      token('/'),
      new Match(false, 'rest', importsRest),
    )
  );
}

// TODO proper types in the parser.
type Raw<T> = T; // Let's cheat a little.

export type ImportAst = importsAst;
export class importsAst extends syntaxTreeNodes {
  importKeyword!: Token<'import'>;
  pathMergedTokens!: MergedTokens;
  
  path: string;
  
  constructor(obj: Raw<importsAst>) {
    super(obj);
    
    this.path = obj.pathMergedTokens.value
    
    // TODO better grammar
    if (this.path.match(/\s/)) throw new Error('space in import.');
  }
  
  static rule = new Caten(
    new Match(false, 'importKeyword', token('import')),
    
    new Match(false, 'pathMergedTokens',
      new Caten(
        new Or(
          new Caten(token('@'), token('identifier'), token('/')),
          new Caten(token('/')),
          new Caten(token('.'), token('/')),
          // TODO add "allowTrailingDelimiter" to Repeat.
          new Repeat(new Caten(token('..'), token('/')), new Caten(), 1),
        ),
        // Make SyntaxTreeNode extend Pattern
        new Match(false, 'null', importsRest),
      ),
    ),
    
    // TODO optional destructuring.
  );
}