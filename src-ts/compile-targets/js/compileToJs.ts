import { PackageAny } from "../../languages/package";
import { Folder, Path } from "../../utils/fs";
import { Workspace } from "../../workspace";
import { NodeJs, Web } from "../targets";
import { TopLevelCodeEmitter } from "./code-emitter";
import { ModuleEmitter } from "./module-compiler";


const outFileTemplate = (script: string) =>
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

export async function compileToJs(
  outFolder: Folder,
  outFilePath: Path,
  workspace: Workspace,
  pkg: PackageAny,
  target: Web | NodeJs,
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
  
  outFolder.writeFile(outFilePath, outFileTemplate(emitter.getCode()));
}
