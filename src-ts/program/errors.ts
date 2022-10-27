import { SrcPosition } from "lr-parser-typescript";

import { ModulePath } from "./modules";


// TODO move to `lr-parser-typescript`
export type SrcRange = srcRanges;
export class srcRanges {
  constructor(
    public start: SrcPosition,
    public end: SrcPosition,
  ) {}
}


export type HyloaError = hyloaErrors;
export abstract class hyloaErrors {
  abstract toString(): string;
}

export type ProgramError = hyloaErrors;
export abstract class programErrors extends hyloaErrors {
  static isWarning = false;
}

export type MissingMainModule = missingMainModuleErrors;
export class missingMainModuleErrors extends programErrors {
  toString(): string {
    return 'The program is missing its main module -- create one under the path `-.hyloa`.';
  }
}

// TODO Folders are also modules. Also this means your ModuleProvider
// approach needs to get revised.
export type UnusedModule = unusedModuleErrors;
export class unusedModuleErrors extends programErrors {
  static isWarning = true;
  
  constructor(
    public path: ModulePath,
  ) { super(); }
  
  toString(): string {
    return 'TODO';
  }
}


export type SourceCodeError = sourceCodeErrors;
export abstract class sourceCodeErrors extends programErrors {
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

export type ModuleLoadTimeSourceCodeError = moduleLoadTimeSourceCodeErrors;
export abstract class moduleLoadTimeSourceCodeErrors extends sourceCodeErrors {}

export type ModuleLoadTimeError = moduleLoadTimeSourceCodeErrors | missingMainModuleErrors;


export type ParseError = parseErrors;
export class parseErrors extends moduleLoadTimeSourceCodeErrors {
  constructor(
    public inModule: ModulePath,
    public at: SrcRange,
    public whatever: unknown,
  ) { super(inModule, at) }
  
  toString(): string {
    return (
      sourceCodeErrors.inAt(this) +
      'Parsing error:\n' +
      this.whatever + '\n' +
      '\n' +
      sourceCodeErrors.sourceHighlight(this)
    );
  }
}

export type NonexistentImportAlias = nonexistentImportAliasErrors;
export class nonexistentImportAliasErrors extends moduleLoadTimeSourceCodeErrors {
  constructor(
    public inModule: ModulePath,
    public at: SrcRange,
    public alias: string,
  ) { super(inModule, at); }
  
  toString(): string {
    return (
      sourceCodeErrors.inAt(this) +
      'Unknown import alias:' + this.alias + '\n' +
      '\n' +
      sourceCodeErrors.sourceHighlight(this)
    );
  }
}

export type NonexistentModule = nonexistentModuleErrors;
export class nonexistentModuleErrors extends moduleLoadTimeSourceCodeErrors {
  constructor(
    public inModule: ModulePath,
    public at: SrcRange,
    public path: ModulePath,
  ) { super(inModule, at); }
  
  toString(): string {
    return (
      sourceCodeErrors.inAt(this) +
      'No module exists under the path:' + this.path + '\n' +
      '\n' +
      sourceCodeErrors.sourceHighlight(this)
    );
  }
}

export type EunawayRelativePath = runawayRelativePathErrors;
export class runawayRelativePathErrors extends moduleLoadTimeSourceCodeErrors {
  constructor(
    public inModule: ModulePath,
    public at: SrcRange,
    public path: string,
  ) { super(inModule, at); }
  
  toString(): string {
    return (
      sourceCodeErrors.inAt(this) +
      'A path musn\'t escape the root folder:' + this.path + '\n' +
      '\n' +
      sourceCodeErrors.sourceHighlight(this)
    );
  }
}
