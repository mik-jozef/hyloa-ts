import { SrcPosition } from "lr-parser-typescript";

import { ModulePath } from "./module";


// TODO move to `lr-parser-typescript`
export class SrcRange {
  constructor(
    public start: SrcPosition,
    public end: SrcPosition,
  ) {}
}


export abstract class HyloaError {
  abstract toString(): string;
}

export abstract class ProgramError extends HyloaError {
  static isWarning = false;
}

export class MissingMainModule extends ProgramError {
  toString(): string {
    return 'The program is missing its main module -- create one under the path `-.hyloa`.';
  }
}

export abstract class SourceCodeError extends ProgramError {
  constructor(
    public modulePath: ModulePath,
    public position: SrcRange,
  ) { super(); }
  
  // TODO add this to `lr-parser-typescript`.
  static srcPositionToString(pos: SrcPosition) {
    return pos.line + ':' + pos.col;
  }
  
  static inAt(err: SourceCodeError): string {
    return 'In ' + err.modulePath.toString() +
      ' at ' + err.position.toString + '\n';
  }
  
  static sourceHighlight(_err: SourceCodeError): string {
    // TODO
    return 'Highlighting relevant lines in the source code is not yet supported.';
  }
}

export abstract class ModuleLoadTimeSourceCodeError extends SourceCodeError {}

export type ModuleLoadTimeError = ModuleLoadTimeSourceCodeError | MissingMainModule;


export class ParseError extends ModuleLoadTimeSourceCodeError {
  constructor(
    public inModule: ModulePath,
    public at: SrcRange,
    public whatever: unknown,
  ) { super(inModule, at) }
  
  toString(): string {
    return (
      SourceCodeError.inAt(this) +
      'Parsing error:\n' +
      this.whatever + '\n' +
      '\n' +
      SourceCodeError.sourceHighlight(this)
    );
  }
}

export class NonexistentImportAlias extends ModuleLoadTimeSourceCodeError {
  constructor(
    public inModule: ModulePath,
    public at: SrcRange,
    public alias: string,
  ) { super(inModule, at); }
  
  toString(): string {
    return (
      SourceCodeError.inAt(this) +
      'Unknown import alias:' + this.alias + '\n' +
      '\n' +
      SourceCodeError.sourceHighlight(this)
    );
  }
}

export class NonexistentModule extends ModuleLoadTimeSourceCodeError {
  constructor(
    public inModule: ModulePath,
    public at: SrcRange,
    public path: ModulePath,
  ) { super(inModule, at); }
  
  toString(): string {
    return (
      SourceCodeError.inAt(this) +
      'No module exists under the path:' + this.path + '\n' +
      '\n' +
      SourceCodeError.sourceHighlight(this)
    );
  }
}

export class RunawayRelativePathError extends ModuleLoadTimeSourceCodeError {
  constructor(
    public inModule: ModulePath,
    public at: SrcRange,
    public path: string,
  ) { super(inModule, at); }
  
  toString(): string {
    return (
      SourceCodeError.inAt(this) +
      'A path musn\'t escape the root folder:' + this.path + '\n' +
      '\n' +
      SourceCodeError.sourceHighlight(this)
    );
  }
}
