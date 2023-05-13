import { Caten, Match, Maybe, MergedTokens, Or, Repeat, SyntaxTreeNode, Token } from "lr-parser-typescript";
import { exit } from "../../../utils/exit.js";
import { ImportAst } from "../../import.js";
import { ParsedPath } from "../../module.js";

import { token } from "./tokenizer.js";


class KebabCase extends SyntaxTreeNode {
  rest!: KebabCase | null;
  
  static rule = new Repeat(token('identifier'), {
    delimiter: token('-'),
    lowerBound: 1,
  });
}

export type ExternalImportAst = LyoImportAst & { parsedPath: ParsedPath };

// TODO proper types in the parser.
type Raw<T> = T; // Let's cheat a little.

export class LyoImportAst extends ImportAst {
  importKeyword!: Token<'import'>;
  pathMergedTokens!: MergedTokens;
  
  path: string;
  parsedPath: ParsedPath | null;
  
  isExternalImport(): this is ExternalImportAst {
    return this.parsedPath === null;
  }
  
  constructor(obj: Raw<LyoImportAst>) {
    super(obj);
    
    this.path = obj.pathMergedTokens.value;
    this.parsedPath = this.parsePath(this.path);
  }
  
  // TODO fix the grammar
  static rule = new Caten(
    new Match(false, 'importPosition', token('import')),
    
    new Match(false, 'pathMergedTokens',
      new Caten(
        new Or(
          new Caten(
            token('@'),
            new Maybe(
              new Caten(
                // This is a temporary hack to avoid grammar conflicts.
                // I need a better parser, but I'll implement it in Hyloa.
                token('$0'),
                new Match(false, '_unused-registry', KebabCase),
              ),
            ),
            new Maybe(
              new Caten(
                token('$1'),
                new Match(false, '_unused-scope', KebabCase),
                token(":"),
              ),
            ),
            token('identifier'),
            new Maybe(
              new Caten(
                token("#"),
                new Match(false, '_unused-version', KebabCase),
              ),
            ),
          ),
          token('/'),
          token('.'),
          new Repeat(token('..'), { delimiter: token('/'), lowerBound: 1 }),
        ),
        new Repeat(
          new Caten(
            token('$2'),
            new Match(false, '_unused', KebabCase),
          ),
          { delimiter: token('/') },
        ),
        new Maybe(
          new Caten(token('identifier'), token('.'), token('identifier')),
        ),
      ),
    ),
    
    // TODO optional destructuring.
  );
  
  private parsePath(path: string): ParsedPath | null {
    if (path[0] !== '@') return null;
    
    const match = path.match(
      /^@(?:(?<registry>[a-z\-]+)\s+)(?:(?<scope>[a-z\-]+):)?(?<name>[a-z\-]+)(?:#(?<versionAlias>[a-z\-]+))?(?<rest>.*)/,
    );
    
    if (!match) exit('Programmer error - cannot match package reference from:', this);
    
    const {
      registry = null,
      scope = null,
      name,
      versionAlias = 'default',
      rest,
    } =
      match.groups!;
    
    if (!name) throw new Error('Programmmer error -- name is mandatory');
    if (!rest) throw new Error('Programmmer error -- rest is mandatory');
    
    return { registry, scope, name, versionAlias, rest };
  }
}