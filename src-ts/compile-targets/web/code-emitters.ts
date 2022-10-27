// TODO perhaps it would be better to emit JavaScript
// syntax trees and then serialize them, wouldn't it?
// That would make it easier to have options like
// pretty print or not

export type CodeEmitter = codeEmitters;
export abstract class codeEmitters {
  abstract indent(extraIndent: string): CodeEmitter;
  
  abstract emit(code: string, extraIndent: string): CodeEmitter
  abstract emitLine(line: string): CodeEmitter;
  
  abstract getCode(): string;
}

export type TopLevelCodeEmitter = topLevelCodeEmitters;
export class topLevelCodeEmitters extends codeEmitters {
  private emittedCode: string[] = [];
  private isAtEmptyLine = true;
  
  constructor(
    public indentNow = '',
  ) { super(); }
  
  indent(extraIndent = '  '): CodeEmitter {
    return new nestedCodeEmitters(this, this.indentNow + extraIndent);
  }
  
  emit(code: string, extraIndent = '') {
    if (code === '') return this;
    
    const indent = this.indent + extraIndent;
    
    if (this.isAtEmptyLine) {
      this.emittedCode.push(indent); // Yes, even if it stays empty.
      this.isAtEmptyLine = false;
    }
    
    this.emittedCode.push(
      code
      .split('\n')
      .map(
        (line, i, lines) => {
          if (i === 0) return line;
          if (i + 1 === lines.length && line === '') {
            this.isAtEmptyLine = true;
            
            return '';
          }
          
          return indent + line;
        })
      .join('\n'),
    );
    
    return this;
  }
  
  emitLine(line: string) {
    return this.emit(line + '\n');
  }
  
  getCode(): string {
    return this.emittedCode.join();
  }
}

export class nestedCodeEmitters extends codeEmitters {
  constructor(
    private parent: TopLevelCodeEmitter,
    private indentNow: string,
  ) { super(); }
  
  indent(extraIndent = '  '): CodeEmitter {
    return new nestedCodeEmitters(this.parent, this.indentNow + extraIndent);
  }
  
  emit(code: string) {
    this.parent.emit(code, this.indentNow)
    
    return this;
  }
  
  emitLine(line: string) {
    return this.emit(line + '\n');
  }
  
  getCode(): string {
    return this.parent.getCode();
  }
}
