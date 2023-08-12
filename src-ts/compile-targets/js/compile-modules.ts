import {
  ModuleLoadError,
  PackageJsonValidationError,
  ProjectJsonError,
} from "../../languages/errors";
import { LocalPackageId } from "../../languages/package";
import { MemoryProvider } from "../../module-provider";
import { Workspace } from "../../workspace";
import { NodeJS, Web } from "../targets";
import { compileToJs } from "./compile-to-js";


export const compileModules = async (
  modules: string | Map<string, string>,
  target: Web | NodeJS,
): Promise<string | ModuleLoadError | ProjectJsonError | PackageJsonValidationError> => {
  const projectName = 'local-project';
  const packageName = 'local-package';
  
  const workspace = new Workspace(
    new MemoryProvider(
      new LocalPackageId(projectName, packageName),
      modules,
    ),
  );
  
  const ret = await workspace.loadAll(projectName, packageName, target);
  
  if (!ret.readyToCompile) return ret.error;
  
  return compileToJs(workspace, ret.pkg, ret.target);
}
