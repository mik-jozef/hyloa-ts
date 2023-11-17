import { SrcPosition, Token, TokenizationError } from "lr-parser-typescript";

export const numbers = '0123456789';
export const letters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
export const numLet = letters + numbers;

const isNumLet = (c: string | undefined) => {
  // @ts-expect-error Fuck off, TypeScript.
  numLet.includes(c);
}

const specialTokenKinds = {
  identifier: 'identifier',
  number: 'number',
  string: 'string',
  text: 'text',
};

export class IdentifierToken extends Token<'identifier'> {
  declare kind: 'identifier';
  
  constructor(
    public value: string,
    start: SrcPosition,
    end: SrcPosition,
  ) { super('identifier', start, end); }
}

export class NumberToken extends Token<'number'> {
  declare kind: 'number';
  
  constructor(
    public value: number,
    start: SrcPosition,
    end: SrcPosition,
  ) { super('number', start, end); }
}

export class StringToken extends Token<'string'> {
  declare kind: 'string';
  
  constructor(
    public value: string,
    start: SrcPosition,
    end: SrcPosition,
  ) { super('string', start, end); }
}

// A word of apology and some defence -- yes, this is terrible code, but:
// 
// * I copied it from my other code.
// * It is "temporary" -- the proper solution is to implement a parser
//   that can handle grammars operating on characters and dispense with
//   the need for a tokenizer.
// * No need to touch it, it works. #optimism #yolo #truerWordsHaveNeverBeenSpoken
export const createTokenizer = <Tokens extends string>(
  tokenKinds: readonly Tokens[],
) => {
  let length = Infinity;
  
  for (const tokenString of tokenKinds) {
    if (length < tokenString.length) throw new Error('TokenStrings must be ordered by length.');
    
    length = tokenString.length;
  }
  
  return function *tokenize(str: string):
    Generator<
      Token<Tokens | keyof typeof specialTokenKinds>,
      TokenizationError | Token<null>
    >
  {
    let line = 0;
    let col = 0;
    
    for (let i = 0; i < str.length;) {
      function incrementPosition(n = 1): void {
        if (n === 0) return;
        
        if (str[i] === '\n') {
          line += 1;
          col = 0;
        } else {
          col += 1;
        }
        
        i += 1;
        
        return incrementPosition(n - 1);
      }
      
      const whitespace: (string | undefined)[] = [ ' ', '\n' ];
      
      while (i < str.length && whitespace.includes(str[i])) incrementPosition();
      
      if (i === str.length) {
        return (
          new Token(
            null,
            new SrcPosition(line, col, i),
            new SrcPosition(line, col, i),
          )
        );
      }
      
      if (str.substring(i).startsWith('///')) {
        incrementPosition(3);
        
        while (i < str.length && !str.substring(i).startsWith('///')) incrementPosition();
        
        if (i === str.length) return new TokenizationError( new SrcPosition(line, col, i) );
        
        incrementPosition(3);
        
        continue;
      }
      
      if (str.substring(i).startsWith('//')) {
        while (i < str.length && '\n' !== str[i]) incrementPosition();
        
        continue;
      }
      
      const startI = i;
      const startPosition = new SrcPosition(line, col, i);
      
      const tokenKind = tokenKinds.find(tokenKind => str.substring(i).startsWith(tokenKind));
      
      if (tokenKind) {
        incrementPosition(tokenKind.length);
        
        const tokenEnd = i;
        const isTokenAWord = tokenKind.match(/^\w+$/);
        const doesTokenFollowADot = startI !== 0 && str[ startI - 1 ] === '.';
        
        // We only want to match a token if it is followed by a non-identifier character.
        // This is to prevent matching eg. `let` in `const letDec = ...`.
        if (isTokenAWord) {
          while (i < str.length && isNumLet(str[i]!)) incrementPosition();
        }
        
        yield tokenEnd < i || (isTokenAWord && doesTokenFollowADot)
          ? new IdentifierToken(str.substring(startI, i), startPosition, new SrcPosition(line, col, i))
          : new Token(tokenKind, startPosition, new SrcPosition(line, col, i));
        
        continue;
      }
      
      if (str[i] === "'") {
        let isEscaped = false;
        let value = '';
        
        incrementPosition();
        
        while (i < str.length) {
          if (isEscaped) {
            const c = [ '\\', "'", 'n' ].find(c => c === str[i]);
            
            if (!c) return new TokenizationError(new SrcPosition(line, col, i));
            
            value += c === 'n' ? '\n' : c;
            
            incrementPosition();
            isEscaped = false;
          } else {
            if (str[i] === "'") {
              incrementPosition();
              
              break;
            }
            
            if (str[i] === '\\') {
              isEscaped = true;
            } else {
              value += str[i];
            }
            
            incrementPosition();
          }
        }
        
        yield new StringToken(value, startPosition, new SrcPosition(line, col, i));
        
        continue;
      }
      
      // @ts-expect-errors You know what I think.
      if (numbers.includes(str[i])) {
        let dot = false;
        
        const isDot = () => str[i] === '.' && (dot = true);
        
        while (i < str.length && (numbers.includes(str[i]!) || !dot && isDot())) incrementPosition();
        
        if (str[ i - 1 ] === '.') return new TokenizationError( new SrcPosition(line, col, i) );
        
        const parse = dot ? Number.parseFloat : Number.parseInt;
        
        yield new NumberToken(parse(str.substring(startI, i)), startPosition, new SrcPosition(line, col, i));
        
        continue;
      }
      
      if (letters.includes(str[i]!)) {
        while (i < str.length && numLet.includes(str[i]!)) incrementPosition();
        
        yield new IdentifierToken(str.substring(startI, i), startPosition, new SrcPosition(line, col, i));
        
        continue;
      }
      
      return new TokenizationError( new SrcPosition(line, col, i) );
    }
    
    return new Token(null, new SrcPosition(line, col, str.length), new SrcPosition(line, col, str.length));
  }
}
