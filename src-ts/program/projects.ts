import { Target } from "../compile-targets/targets";
import { fuckThrow } from "../utils/exit";
import { Package } from "./packages";


export type Program = programs;
export class programs {
  constructor(
    public name: string,
    public target: Target,
    public mainPackage: string, // I guess only local modules should be allowed, right?
  ) {}
  
  fromProgramJson(value: unknown, isSerialized: false): Program;
  fromProgramJson(value: string, isSerialized: true): Program;
  
  fromProgramJson(value: unknown, isSerialized: boolean): Program | SyntaxError {
    if (!isSerialized) {
      value = fuckThrow(() => JSON.parse(value as string));
      
      if (value instanceof SyntaxError) return value;
      if (value instanceof Error) throw value;
    }
    
    /*/
      TODO validation. A "ValidationError" class should be a part of Hyloa's
      standard library, and Hyloa's Json.parse should accept an optional
      Schema argument.
    /*/
    const validated = value as any;
    
    return new programs(validated.name, validated.target, validated.mainPackage);
  }
}

export type ProjectSettings = projectSettingObjects;
export class projectSettingObjects {
  // A program's name should be in camelCase.
  programs = new Map<string, Program>()
}

export type Project = projects;
export class projects {
  settings: ProjectSettings | null = null;
  // Contains the local packages of the project, indexed by their folder name.
  packages = new Map<string, Package>();
}
