import { Caten, Match, Maybe, Or, RawNode, Repeat, SyntaxTreeNode, Token } from "lr-parser-typescript";
import { exit } from "../../../utils/exit.js";
import { ImportAst } from "../../import.js";
import { ParsedPath } from "../../module.js";
import { IdentifierToken } from "../../create-tokenizer.js";


export const matchMembersDestructuredMembers = new Match('members', null!);

/*/
  Example imports. A file must have an extension, a folder must
  not.
  
  ```
    // "#legacy" is a version alias
    import ::npm mik-jozef:http-server#legacy/server/port.hyloa
    import ::npm http-server/server/port.hyloa
    import mik-jozef:http-server/server/port.hyloa
    import http-server/server/port.hyloa
    import /foo/bar.hyloa
    import ./ba-az.hyloa
  ```
/*/

class KebabCase extends SyntaxTreeNode {
  rest!: KebabCase | null;
  
  static pattern = new Repeat('identifier', {
    delimiter: '-',
    lowerBound: 1,
  });
}

export type ExternalImportAst = HyloaImportAst & { parsedPath: ParsedPath };

export class HyloaImportAst extends ImportAst {
  // Matched so we can anchor errors at the keyword position.
  importKeyword!: Token<'import'>;
  pathTokens!: Token<string>[];
  
  path: string;
  parsedPath: ParsedPath | null;
  
  constructor(obj: RawNode) {
    super(obj);
    
    this.path = this.pathTokens
      .map((token) => {
        return token instanceof IdentifierToken ? token.value : token.kind;
      })
      .join('');
    
    this.parsedPath = this.parsePath(this.path);
  }
  
  // TODO fix the grammar
  static pattern = new Caten(
    new Match('importKeyword', 'import'),
    
    new Match('pathTokens',
      new Caten(
        new Or(
          new Caten(),
            // TODO optional slash after this, but required if followed by a path
          new Caten(
            new Maybe(
              new Caten(
                '::',
                new Match('_unused-registry', KebabCase),
              ),
            ),
            new Maybe(
              new Caten(
                '$0',
                new Match('_unused-scope', KebabCase),
                ":",
              ),
            ),
            'identifier',
            new Maybe(
              new Caten(
                "#",
                new Match('_unused-version', KebabCase),
              ),
            ),
          ),
          '.',
          '..',
          /*new Repeat(token('..'), {
            delimiter: token('/'),
            lowerBound: 1,
          }),*/
        ),
        new Maybe(
          new Caten(
            new Repeat(
              '/',
              {
                delimiter: new Or(
                  new Match('_unused-folder', KebabCase),
                  new Match('_unused-folder', '..'),
                ),
                trailingDelimiter: new Caten('identifier', '.', 'identifier'),
                lowerBound: 1,
              }
            ),
          ),
        ),
      ),
    ),
    
    new Maybe(
      new Caten(
        'with',
        matchMembersDestructuredMembers,
      ),
    ),
  );
  
  private parsePath(path: string): ParsedPath | null {
    if ([ '/', '.' ].includes(path[0]!)) return null;
    
    const match = path.match(
      /^(?:@(?<registry>[a-z\-]+)\s+)?(?:(?<scope>[a-z\-]+):)?(?<name>[a-z\-]+)(?:#(?<versionAlias>[a-z\-]+))?(?<rest>.*)/,
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