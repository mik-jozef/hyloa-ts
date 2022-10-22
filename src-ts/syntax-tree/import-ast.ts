import { Caten, Match, MergedTokens, Or, Repeat, SyntaxTreeNode, Token } from "lr-parser-typescript";

import { token } from "./tokenizer.js";


class ImportRest extends SyntaxTreeNode {
  rest!: ImportRest | null;
  
  static rule: Or = new Or(
    new Caten(),
    token('identifier'),
    new Caten(
      token('identifier'),
      token('/'),
      new Match(false, 'rest', ImportRest),
    )
  );
}

// TODO proper types in the parser.
type Raw<T> = T; // Let's cheat a little.

export class ImportAst extends SyntaxTreeNode {
  importKeyword!: Token<'import'>;
  pathMergedTokens!: MergedTokens;
  
  path: string;
  
  constructor(obj: Raw<ImportAst>) {
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
        new Match(false, 'null', ImportRest),
      ),
    ),
    
    // TODO optional destructuring.
  );
}