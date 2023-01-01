import { SrcPosition, SrcPosition as srcPositions } from "lr-parser-typescript";
import { JsonValidationError } from "../utils/json-validation-error";

import { ModulePathAny, ParsedPath } from "./module";
import { PackageId } from "./package";


// TODO move to `lr-parser-typescript`
export class SrcRange {
  constructor(
    public start: SrcPosition,
    public end: SrcPosition,
  ) {}
}

// type SrcRangeZero = SrcRange & { start: { i: 0 }, end: { i: 0 } };
export const srcRangeZeros = () =>
  new SrcRange(new srcPositions(0, 0, 0), new srcPositions(0, 0, 0));


export abstract class ProgramError {
  static isWarning = false;
  
  // TODO split into several functions? `toString` (with a default impl.), `toExtendedString`, `toShortString`
  // Also refactor so that the short error description does not
  // have to be followed by `sourceCodeErrors.sourceHighlight(this)` in every overload.
  abstract toString(): string;
}

export abstract class ProjectJsonError extends ProgramError {
  abstract projectName: string;
}

export class MissingProjectJson extends ProjectJsonError {
  constructor(
    public projectName: string,
  ) { super(); }
  
  toString(): string {
    return `The project ${this.projectName} is missing the file \`project.json\` (or does not exist).`;
  }
}

export class ProjectJsonValidationError extends ProjectJsonError {
  constructor(
    public projectName: string,
    public error: JsonValidationError<never>, // TODO
  ) { super(); }
  
  // TODO be more informative.
  toString(): string {
    return `The project ${this.projectName}'s \`project.json\` file contains errors.`;
  }
}

// TODO rename to sth like ProjectJsonModuleLoaderError?
export class ProjectJsonModuleProviderError extends ProjectJsonError {
  constructor(
    public projectName: string,
    public error: unknown,
  ) { super(); }
  
  toString(): string {
    return `The project ${this.projectName}'s \`project.json\` file could not be loaded.`;
  }
}

export class PackageJsonValidationError extends ProgramError {
  constructor(
    public packageId: PackageId,
    public error: JsonValidationError<never>, // TODO
  ) { super(); }
  
  // TODO be more informative.
  toString(): string {
    return `TODO.`;
  }
}

// TODO this should also print a warning that the unused
// module might be used in other unused modules.
export class UnusedModule extends ProgramError {
  static isWarning = true;
  
  constructor(
    public path: ModulePathAny,
  ) { super(); }
  
  toString(): string {
    return 'TODO';
  }
}


export abstract class SourceCodeError extends ProgramError {
  abstract inModule: ModulePathAny;
  abstract at: SrcRange;
  
  // TODO add this to `lr-parser-typescript`.
  static srcPositionToString(pos: SrcPosition) {
    return pos.line + ':' + pos.col;
  }
  
  static inAt(err: SourceCodeError): string {
    return 'In ' + err.inModule.toString() +
      ' at ' + err.at.toString + '\n';
  }
  
  static sourceHighlight(_err: SourceCodeError): string {
    // TODO
    return 'Highlighting relevant lines in the source code is not yet supported.';
  }
}

export abstract class ModuleLoadTimeSourceCodeError extends SourceCodeError {
  fuckTypeScript: 'fuckTypeScript0' = 'fuckTypeScript0';
}

export type ModuleLoadTimeError =
  | ModuleLoadTimeSourceCodeError
  | ModuleLoadError
  | ProjectJsonError
  | PackageJsonValidationError
;


export class ParseError extends ModuleLoadTimeSourceCodeError {
  constructor(
    public inModule: ModulePathAny,
    public at: SrcRange,
    public whatever: unknown,
  ) { super(); }
  
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

export class MissingRegistry extends ModuleLoadTimeSourceCodeError {
  constructor(
    public inModule: ModulePathAny,
    public at: SrcRange,
    public dependency: ParsedPath,
  ) { super(); }
  
  toString(): string {
    return (
      SourceCodeError.inAt(this) +
      `TODO\n` +
      '\n' +
      SourceCodeError.sourceHighlight(this)
    );
  }
}

export class UnknownDependency extends ModuleLoadTimeSourceCodeError {
  constructor(
    public inModule: ModulePathAny,
    public at: SrcRange,
    public dependency: ParsedPath,
  ) { super(); }
  
  toString(): string {
    return (
      SourceCodeError.inAt(this) +
      `TODO\n` +
      '\n' +
      SourceCodeError.sourceHighlight(this)
    );
  }
}

export class UnknownVersionAlias extends ModuleLoadTimeSourceCodeError {
  constructor(
    public inModule: ModulePathAny,
    public at: SrcRange,
    public alias: string,
  ) { super(); }
  
  toString(): string {
    return (
      SourceCodeError.inAt(this) +
      `Version alias: ${this.alias} does not exist. '\n` +
      '\n' +
      SourceCodeError.sourceHighlight(this)
    );
  }
}

export type ImportReference = [ ModulePathAny, SrcRange ];

export abstract class ModuleLoadError extends ProgramError {
  abstract importReferences: ImportReference[];
  
  abstract inModule: ModulePathAny;
  
  static inNoAt(err: ModuleLoadError): string {
    return 'In ' + err.inModule.toString() + '\n';
  }
}

export class ModuleNotFound extends ModuleLoadError {
  importReferences: ImportReference[];
  
  constructor(
    // The path of the file that could not be imported.
    public inModule: ModulePathAny,
    importReference: ImportReference | null = null,
  ) {
    super();
    
    this.importReferences = importReference ? [ importReference ] : [];
  }
  
  toString(): string {
    return (
      ModuleLoadError.inNoAt(this) +
      'No module exists under the path:' + this.inModule + '.'
    );
  }
}

/*/
  This error is only reported at the path of the imported file,
  with srcRange "0:0".
/*/
export class OtherModuleProviderError extends ModuleLoadError {
  importReferences: ImportReference[];
  
  at = srcRangeZeros();
  
  constructor(
    // The path of the file that could not be imported.
    public inModule: ModulePathAny,
    public error: unknown,
    importReference: ImportReference | null = null,
  ) {
    super();
    
    this.importReferences = importReference ? [ importReference ] : [];
  }
  
  toString(): string {
    return (
      SourceCodeError.inAt(this) +
      'An error occured while loading the content of' + this.inModule + '\n' +
      '\n' +
      SourceCodeError.sourceHighlight(this)
    );
  }
}

export class UnsupportedFileType extends ModuleLoadError {
  importReferences: ImportReference[];
  
  constructor(
    // The path of the file that could not be imported.
    public inModule: ModulePathAny,
    importReference: ImportReference | null = null,
  ) {
    super();
    
    this.importReferences = importReference ? [ importReference ] : [];
  }
  
  toString(): string {
    return (
      ModuleLoadError.inNoAt(this)
      + `The file "${this.inModule} has an unsupported extension.`
      + 'Did you mean to use a file loader?'
    );
  }
}

export class RunawayRelativePath extends ModuleLoadTimeSourceCodeError {
  constructor(
    public inModule: ModulePathAny,
    public at: SrcRange,
    public path: string,
  ) { super(); }
  
  toString(): string {
    return (
      SourceCodeError.inAt(this) +
      'A path musn\'t escape the root folder:' + this.path + '\n' +
      '\n' +
      SourceCodeError.sourceHighlight(this)
    );
  }
}
