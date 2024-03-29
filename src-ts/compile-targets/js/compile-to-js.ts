import { ModulePathLibrary } from "../../languages/module.js";
import { PackageAny, PackageId } from "../../languages/package.js";
import { exit } from "../../utils/exit.js";
import { FolderHandle, Path } from "../../utils/fs.js";
import { Workspace } from "../../workspace.js";
import { NodeJS, Web } from "../targets.js";
import { TopLevelCodeEmitter } from "../code-emitter.js";
import { ModuleEmitter } from "./module-emitter.js";


const templateCommon =
`const _go = (fn, ...args) => {
  let stack = [], ret = null;
  fn(stack, ...args);
  while (stack[stack.length - 1].go) ret = stack[stack.length-1].go();
  return ret;
}

`;

const webFileTemplate = (script: string) =>
`<!doctype html>

<html>
<head>
  <title>An unnamed hyloa app</title>
  
  <meta charset="utf8" />
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>

<body>
<div id="content-root">

<script type="module">
${templateCommon}
${script}
</script>

</body>
</html>
`;

const nodeJsFileTemplate = (script: string) =>
`${templateCommon}
${script}
`;

const createEmitters = (workspace: Workspace, moduleEmitters: Map<string, ModuleEmitter>) => {
  for (const moduleEmitter of moduleEmitters.values()) {
    for (const moduleImport of moduleEmitter.module.imports) {
      const importedPath = moduleImport.importedPath as ModulePathLibrary;
      
      if (!(importedPath.packageId instanceof PackageId)) continue; // TODO emit stlib;
      
      const importedPackage = workspace.getPackage(importedPath.packageId);
      
      const importedModule = importedPackage.modules.get(importedPath.toString(false)) ?? null;
      
      if (!importedModule) exit('Unimplemented: imported path does not exist:', importedPath);
      
      moduleEmitters.set(importedPath.toString(), new ModuleEmitter(importedModule));
    }
  }
}

export function compileToJs(
  workspace: Workspace,
  pkg: PackageAny,
  target: Web | NodeJS,
):
  string
{
  const emitter = new TopLevelCodeEmitter(target.constructor === Web ? '  ' : '');
  const moduleEmitters = new Map<string, ModuleEmitter>();
  
  const mainModule = pkg.modules.get('/main.hyloa');
  
  if (!mainModule) exit(`The package ${pkg.id} has no main module.`);
  
  moduleEmitters.set(mainModule.path.toString(), new ModuleEmitter(mainModule));
  
  createEmitters(workspace, moduleEmitters);
  
  for (const moduleEmitter of moduleEmitters.values()) {
    moduleEmitter.emitSkeletons();
  }
  
  emitter.emit('\n\n');
  
  for (const moduleEmitter of moduleEmitters.values()) {
    moduleEmitter.emitInitializers();
  }
  
  const fileTemplate = target.constructor === Web ? webFileTemplate : nodeJsFileTemplate;
  
  return fileTemplate(emitter.getCode());
}

export const compileToJsAndSave = (
  outFolder: FolderHandle,
  outFilePath: Path,
  workspace: Workspace,
  pkg: PackageAny,
  target: Web | NodeJS,
) => {
  const str = compileToJs(workspace, pkg, target);
  
  return outFolder.writeFile(outFilePath, str);
}