// @ts-ignore
type String = string; type Null = null; type Boolean = boolean; type Number = number; type BigInt = bigint; type Symbol = symbol; type Unknown = unknown; type Never = never; type Any = any; type Void = void

import { Caten, Match, Maybe, MergedTokens, Or, Repeat, SyntaxTreeNode as syntaxTreeNodes, Token } from "lr-parser-typescript";
import { exit } from "../../../utils/exit.js";
import { importAsts } from "../../imports.js";
import { ParsedPath } from "../../modules.js";

import { token } from "./tokenizer.js";


/*/
  Example imports. A file must have an extension, a folder
  must not.
  
  ```
    import @npm mik-jozef:http-server#legacy/server/port.hyloa
    import @npm http-server/server/port.hyloa
    import @mik-jozef:http-server/server/port.hyloa
    import @http-server/server/port.hyloa
    import /foo/bar.hyloa
    import ./ba-az.hyloa
  ```
/*/

type KebabCase = kebabCases;
class kebabCases extends syntaxTreeNodes {
  rest!: kebabCases | null;
  
  static rule = new Repeat(token('identifier'), token('-'), 1);
}

export type ExternalImportAst = ImportAst & { parsedPath: ParsedPath };

// TODO proper types in the parser.
type Raw<T> = T; // Let's cheat a little.

export type ImportAst = hyloaImportAsts;
export class hyloaImportAsts extends importAsts {
  importPosition!: Token<'import'>;
  pathMergedTokens!: MergedTokens;
  
  path: string;
  parsedPath: ParsedPath | Null;
  
  isExternalImport(): this is ExternalImportAst {
    return this.parsedPath === null;
  }
  
  constructor(obj: Raw<hyloaImportAsts>) {
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
            new Maybe( new Match(false, '_unused-registry', kebabCases) ),
            new Maybe(
              new Caten(
                new Match(false, '_unused-scope', kebabCases),
                token(":"),
              ),
            ),
            token('identifier'),
            new Maybe(
              new Caten(
                token("#"),
                new Match(false, '_unused-version', kebabCases),
              ),
            ),
          ),
          token('/'),
          token('.'),
          new Repeat(token('..'), token('/'), 1),
        ),
        new Repeat(
          new Match(false, '_unused', kebabCases),
          token('/'),
        ),
        new Maybe(
          new Caten(token('identifier'), token('.'), token('identifier')),
        ),
      ),
    ),
    
    // TODO optional destructuring.
  );
  
  private parsePath(path: String): ParsedPath | Null {
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
    
    return { registry, scope, name, versionAlias, rest };
  }
}