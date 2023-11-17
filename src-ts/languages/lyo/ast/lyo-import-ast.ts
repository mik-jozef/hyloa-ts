import { Caten, Match, Maybe, Or, Repeat, SyntaxTreeNode, Token, RawNode } from "lr-parser-typescript";
import { exit } from "../../../utils/exit.js";
import { ImportAst } from "../../import.js";
import { ParsedPath } from "../../module.js";
import { IdentifierToken } from "../../create-tokenizer.js";


class KebabCase extends SyntaxTreeNode {
  rest!: KebabCase | null;
  
  static pattern = new Repeat('identifier', {
    delimiter: '-',
    lowerBound: 1,
  });
}

export type ExternalImportAst = LyoImportAst & { parsedPath: ParsedPath };

export class LyoImportAst extends ImportAst {
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
    new Match('importPosition', 'import'),
    
    new Match('pathTokens',
      new Caten(
        new Or(
          new Caten(
            '@',
            new Maybe(
              new Caten(
                // This is a temporary hack to avoid grammar conflicts.
                // I need a better parser, but I'll implement it in Hyloa.
                '$0',
                new Match('_unused-registry', KebabCase),
              ),
            ),
            new Maybe(
              new Caten(
                '$1',
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
          '/',
          '.',
          new Repeat('..', { delimiter: '/', lowerBound: 1 }),
        ),
        new Repeat(
          new Caten(
            '$2',
            new Match('_unused', KebabCase),
          ),
          { delimiter: '/' },
        ),
        new Maybe(
          new Caten('identifier', '.', 'identifier'),
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