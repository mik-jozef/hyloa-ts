// @ts-ignore
type String = string; type Null = null; type Boolean = boolean; type Number = number; type BigInt = bigint; type Symbol = symbol; type Unknown = unknown; type Never = never; type Any = any; type Void = void

import { SrcPosition, SrcPosition as srcPositions } from "lr-parser-typescript";
import { ParsedPath } from "../syntax-trees/imports-sts";
import { JsonValidationError } from "../utils/validationErrors";

import { ModulePath } from "./modules";
import { PackageId } from "./packages";


// TODO move to `lr-parser-typescript`
export type SrcRange = srcRanges;
export class srcRanges {
  constructor(
    public start: SrcPosition,
    public end: SrcPosition,
  ) {}
}

// type SrcRangeZero = SrcRange & { start: { i: 0 }, end: { i: 0 } };
export const srcRangeZeros = () =>
  new srcRanges(new srcPositions(0, 0, 0), new srcPositions(0, 0, 0));


export type HyloaError = hyloaErrors;
export abstract class hyloaErrors {
  // TODO split into several functions? `toString` (with a default impl.), `toExtendedString`, `toShortString`
  // Also refactor so that the short error description does not
  // have to be followed by `sourceCodeErrors.sourceHighlight(this)` in every overload.
  abstract toString(): string;
}

export type ProgramError = hyloaErrors;
export abstract class programErrors extends hyloaErrors {
  static isWarning = false;
}

// TODO delete?
export type MissingMainModule = missingMainModuleErrors;
export class missingMainModuleErrors extends programErrors {
  fuckTypeScript: 'fuckTypeScript1' = 'fuckTypeScript1';
  
  toString(): string {
    return 'The program is missing its main module -- create one under the path `.hyloa`.';
  }
}

export type ProjectJsonError = projectJsonErrors;
export abstract class projectJsonErrors extends programErrors {
  abstract projectName: String;
}

export type MissingProjectJson = missingProjectJsonErrors;
export class missingProjectJsonErrors extends projectJsonErrors {
  constructor(
    public projectName: String,
  ) { super(); }
  
  toString(): string {
    return `The project ${this.projectName} is missing the file \`project.json\` (or does not exist).`;
  }
}

export type ProjectJsonValidationError = projectJsonValidationErrors;
export class projectJsonValidationErrors extends projectJsonErrors {
  constructor(
    public projectName: String,
    public error: JsonValidationError<never>, // TODO
  ) { super(); }
  
  // TODO be more informative.
  toString(): string {
    return `The project ${this.projectName}'s \`project.json\` file contains errors.`;
  }
}

export type OtherProjectJsonLoadError = otherProjectJsonLoadErrors;
export class otherProjectJsonLoadErrors extends projectJsonErrors {
  constructor(
    public projectName: String,
    public error: Unknown,
  ) { super(); }
  
  toString(): string {
    return `The project ${this.projectName}'s \`project.json\` file could not be loaded.`;
  }
}

export type PackageJsonValidationError = packageJsonValidationErrors;
export class packageJsonValidationErrors extends programErrors {
  constructor(
    public packageId: PackageId,
    public error: JsonValidationError<never>, // TODO
  ) { super(); }
  
  // TODO be more informative.
  toString(): string {
    return `TODO.`;
  }
}

// TODO Folders are also modules, right?.
// TODO this should also print a warning that the unused
// module might be used in other unused modules.
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
  abstract inModule: ModulePath;
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

export type ModuleLoadTimeSourceCodeError = moduleLoadTimeSourceCodeErrors;
export abstract class moduleLoadTimeSourceCodeErrors extends sourceCodeErrors {
  fuckTypeScript: 'fuckTypeScript0' = 'fuckTypeScript0';
}

export type ModuleLoadTimeError =
  | ModuleLoadTimeSourceCodeError
  | ModuleLoadError
  | MissingMainModule
  | ProjectJsonError
  | PackageJsonValidationError
;


export type ParseError = parseErrors;
export class parseErrors extends moduleLoadTimeSourceCodeErrors {
  constructor(
    public inModule: ModulePath,
    public at: SrcRange,
    public whatever: Unknown,
  ) { super(); }
  
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

export type MissingRegistry = missingRegistryErrors;
export class missingRegistryErrors extends moduleLoadTimeSourceCodeErrors {
  constructor(
    public inModule: ModulePath,
    public at: SrcRange,
    public dependency: ParsedPath,
  ) { super(); }
  
  toString(): String {
    return (
      sourceCodeErrors.inAt(this) +
      `TODO\n` +
      '\n' +
      sourceCodeErrors.sourceHighlight(this)
    );
  }
}

export type UnknownDependency = unknownDependencyErrors;
export class unknownDependencyErrors extends moduleLoadTimeSourceCodeErrors {
  constructor(
    public inModule: ModulePath,
    public at: SrcRange,
    public dependency: ParsedPath,
  ) { super(); }
  
  toString(): String {
    return (
      sourceCodeErrors.inAt(this) +
      `TODO\n` +
      '\n' +
      sourceCodeErrors.sourceHighlight(this)
    );
  }
}

export type UnknownVersionAlias = unknownVersionAliasErrors;
export class unknownVersionAliasErrors extends moduleLoadTimeSourceCodeErrors {
  constructor(
    public inModule: ModulePath,
    public at: SrcRange,
    public alias: string,
  ) { super(); }
  
  toString(): string {
    return (
      sourceCodeErrors.inAt(this) +
      `Version alias: ${this.alias} does not exist. '\n` +
      '\n' +
      sourceCodeErrors.sourceHighlight(this)
    );
  }
}

export type ImportReference = [ ModulePath, SrcRange ];

export type ModuleLoadError = moduleLoadErrors;
export abstract class moduleLoadErrors extends programErrors {
  abstract importReferences: ImportReference[];
  
  abstract inModule: ModulePath;
  
  static inNoAt(err: ModuleLoadError): string {
    return 'In ' + err.inModule.toString() + '\n';
  }
}

export type ModuleNotFound = moduleNotFoundErrors;
export class moduleNotFoundErrors extends moduleLoadErrors {
  importReferences: ImportReference[];
  
  constructor(
    // The path of the file that could not be imported.
    public inModule: ModulePath,
    public importReference: ImportReference | Null = null,
  ) {
    super();
    
    this.importReferences = importReference ? [ importReference ] : [];
  }
  
  toString(): string {
    return (
      moduleLoadErrors.inNoAt(this) +
      'No module exists under the path:' + this.inModule + '.'
    );
  }
}

/*/
  This error is only reported at the path of the imported file,
  with srcRange "0:0".
/*/
export type OtherModuleProviderError = otherModuleProviderErrors;
export class otherModuleProviderErrors extends moduleLoadErrors {
  importReferences: ImportReference[];
  
  at = srcRangeZeros();
  
  constructor(
    // The path of the file that could not be imported.
    public inModule: ModulePath,
    public error: Unknown,
    importReference: ImportReference | Null = null,
  ) {
    super();
    
    this.importReferences = importReference ? [ importReference ] : [];
  }
  
  toString(): string {
    return (
      sourceCodeErrors.inAt(this) +
      'An error occured while loading the content of' + this.inModule + '\n' +
      '\n' +
      sourceCodeErrors.sourceHighlight(this)
    );
  }
}

export type RunawayRelativePath = runawayRelativePathErrors;
export class runawayRelativePathErrors extends moduleLoadTimeSourceCodeErrors {
  constructor(
    public inModule: ModulePath,
    public at: SrcRange,
    public path: string,
  ) { super(); }
  
  toString(): string {
    return (
      sourceCodeErrors.inAt(this) +
      'A path musn\'t escape the root folder:' + this.path + '\n' +
      '\n' +
      sourceCodeErrors.sourceHighlight(this)
    );
  }
}
