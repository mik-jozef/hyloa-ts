import { Caten, Match, Maybe, MergedTokens, Or, Repeat, SyntaxTreeNode, Token } from "lr-parser-typescript";
import { exit } from "../../../utils/exit.js";
import { ImportAst } from "../../import.js";
import { ParsedPath } from "../../module.js";

import { token } from "./tokenizer.js";


/*/
  Example imports. A file must have an extension, a folder
  must not.
  
  ```
    // "#legacy" is a version alias
    import @npm mik-jozef:http-server#legacy/server/port.hyloa
    import @npm http-server/server/port.hyloa
    import mik-jozef:http-server/server/port.hyloa
    import http-server/server/port.hyloa
    import /foo/bar.hyloa
    import ./ba-az.hyloa
  ```
/*/

class KebabCase extends SyntaxTreeNode {
  rest!: KebabCase | null;
  
  static rule = new Repeat(token('identifier'), {
    delimiter: token('-'),
    lowerBound: 1,
  });
}

export type ExternalImportAst = HyloaImportAst & { parsedPath: ParsedPath };

// TODO proper types in the parser.
type Raw<T> = T; // Let's cheat a little.

export class HyloaImportAst extends ImportAst {
  // Matched so we can anchor errors at the keyword position.
  importKeyword!: Token<'import'>;
  pathMergedTokens!: MergedTokens;
  
  path: string;
  parsedPath: ParsedPath | null;
  
  isExternalImport(): this is ExternalImportAst {
    return this.parsedPath === null;
  }
  
  constructor(obj: Raw<HyloaImportAst>) {
    super(obj);
    
    this.path = obj.pathMergedTokens.value;
    this.parsedPath = this.parsePath(this.path);
  }
  
  // TODO fix the grammar
  static rule = new Caten(
    new Match(false, 'importKeyword', token('import')),
    
    new Match(false, 'pathMergedTokens',
      new Caten(
        new Or(
          new Caten(),
            // TODO optional slash after this, but required if followed by a path
          new Caten(
            new Maybe(
              new Caten(
                token('@'),
                new Match(false, '_unused-registry', KebabCase),
              ),
            ),
            new Maybe(
              new Caten(
                token('$0'),
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
          token('.'),
          new Repeat(token('..'), {
            delimiter: token('/'),
            lowerBound: 1,
          }),
        ),
        new Maybe(
          new Caten(
            token('$1'),
            new Repeat(
              token('/'),
              {
                delimiter: new Match(false, '_unused-folder', KebabCase),
                trailingDelimiter: new Caten(token('identifier'), token('.'), token('identifier')),
                lowerBound: 1,
              }
            ),
          ),
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