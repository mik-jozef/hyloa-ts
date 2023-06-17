import { PackageAny } from "../../languages/package.js";
import { Folder, Path } from "../../utils/fs.js";
import { Workspace } from "../../workspace.js";
import { NodeJS, Web } from "../targets.js";
import { TopLevelCodeEmitter } from "./code-emitter.js";
import { ModuleEmitter } from "./module-compiler.js";


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
${script}
</script>

</body>
</html>
`;

const nodeJsFileTemplate = (script: string) => script;

export async function compileToJs(
  outFolder: Folder,
  outFilePath: Path,
  workspace: Workspace,
  pkg: PackageAny,
  target: Web | NodeJS,
):
  Promise<void>
{
  const emitter = new TopLevelCodeEmitter(target.constructor === Web ? '  ' : '');
  const moduleEmitterSet = new Set<ModuleEmitter>();
  
  const mainModule = pkg.modules.get('/main.hyloa');
  
  // TODO create emitters.
  
  for (const moduleEmitter of moduleEmitterSet) {
    moduleEmitter.emitSkeletons();
  }
  
  emitter.emit('\n\n');
  
  for (const moduleEmitter of moduleEmitterSet) {
    moduleEmitter.emitInitializers();
  }
  
  const fileTemplate = target.constructor === Web ? webFileTemplate : nodeJsFileTemplate;
  
  outFolder.writeFile(outFilePath, fileTemplate(emitter.getCode()));
}
