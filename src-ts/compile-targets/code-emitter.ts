// TODO perhaps it would be better to emit JavaScript
// syntax trees and then serialize them, wouldn't it?
// That would make it easier to have options like
// pretty print or not
// TODO this is why Hyloa's standard library should
// contain its own syntax tree representation.

import { exit } from "../utils/exit.js";

type EmitterFn = (emitter: CodeEmitter) => void;

export class Hole {
  // If you ever need to support multiline holes. Set this in `CodeEmitter#emit`.
  // indentNow: string | null = null;
  
  constructor(
    private value: string | null = null,
  ) {}
  
  getValue() { return this.value; }
  
  setValue(val: string) {
    if (val.includes('\n')) exit('Unimplemented - a hole cannot contain newlines', val);
  
    this.value = val;
  }
}

export abstract class CodeEmitter {
  abstract indent(emitterFn: EmitterFn): CodeEmitter;
  abstract indent(extraIndent: string, emitterFn: EmitterFn): CodeEmitter;
  
  abstract emit(code: string | Hole): CodeEmitter
  abstract emitLine(line: string): CodeEmitter;
  
  abstract getCode(): string;
}

export class TopLevelCodeEmitter extends CodeEmitter {
  private emittedCode: (string | Hole)[] = [];
  private isAtEmptyLine = true;
  
  constructor(
    public indentNow = '',
  ) { super(); }
  
  indent(emitterFn: EmitterFn): CodeEmitter;
  indent(extraIndent: string, emitterFn: EmitterFn): CodeEmitter;
  indent(arg0: string | EmitterFn, arg1?: EmitterFn): CodeEmitter {
    const extraIndent = typeof arg0 === 'string' ? arg0 : '  ';
    const emitterFn = typeof arg0 === 'string' ? arg1! : arg0;
    
    emitterFn(new NestedCodeEmitter(this, this.indentNow + extraIndent));
    
    return this;
  }
  
  emit(code: string | Hole, indentNow = this.indentNow) {
    if (code === '') return this;
    
    if (this.isAtEmptyLine) {
      this.emittedCode.push(indentNow); // Yes, even if it stays empty.
      this.isAtEmptyLine = false;
    }
    
    if (code instanceof Hole) {
      this.emittedCode.push(code);
      
      return this;
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
          
          return indentNow + line;
        })
      .join('\n'),
    );
    
    return this;
  }
  
  emitLine(line: string) {
    return this.emit(line + '\n');
  }
  
  getCode(): string {
    return this.emittedCode.map((codePiece) => {
      if (typeof codePiece === 'string') return codePiece;
      
      const value = codePiece.getValue();
      
      if (value === null) exit('Programmer error -- emitting a null hole.')
      
      return value;
    }).join('');
  }
}

export class NestedCodeEmitter extends CodeEmitter {
  constructor(
    private parent: TopLevelCodeEmitter,
    private indentNow: string,
  ) { super(); }
  
  indent(emitterFn: EmitterFn): CodeEmitter;
  indent(extraIndent: string, emitterFn: EmitterFn): CodeEmitter;
  indent(arg0: string | EmitterFn, arg1?: EmitterFn): CodeEmitter {
    const extraIndent = typeof arg0 === 'string' ? arg0 : '  ';
    const emitterFn = typeof arg0 === 'string' ? arg1! : arg0;
    
    emitterFn(new NestedCodeEmitter(this.parent, this.indentNow + extraIndent));
    
    return this;
  }
  
  emit(code: string | Hole) {
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
