// @ts-ignore
type String = string; type Null = null; type Boolean = boolean; type Number = number; type BigInt = bigint; type Symbol = symbol; type Unknown = unknown; type Never = never; type Any = any; type Void = void

import { JsonValidationError } from "../utils/validationErrors";
import { LocalPackage } from "./packages";

/*/
  A reprezentation of `project.json.`
  
  The schema of the file (for more details, see the docs of
  `package.json`):
  
  ```
    ProjectSettings = {
      registries: Record<KebabCase | '', String>,
      defaultRegistry: KebabCase | Null,
    }
  ```
/*/
export type ProjectJson = projectJsons;
export class projectJsons {
  constructor(
    public defaultRegistry: String | Null = null,
    public registries: Map<String, String>,
  ) {}
  
  static fromJson(json: string): ProjectJson | JsonValidationError<never> {
    const parsed = JSON.parse(json);
    
    return new projectJsons(
      parsed.defaultRegistry,
      new Map(Object.entries(parsed.registries)),
    );
  }
}

/*/
  Folder name must be kebab-case.
/*/
export type Project = projects;
export class projects {
  // Contains the local packages of the project, indexed by their (folder) name.
  packages = new Map<String, LocalPackage>();
  
  constructor(
    // Name of the folder the project is in.
    public name: String,
    public projectJson: ProjectJson,
  ) {}
}
