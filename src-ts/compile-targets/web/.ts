import { LocalPackageId } from "../../languages/package";
import { Folder, Path } from "../../utils/fs";
import { Workspace } from "../../workspace";
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

export async function compile(
  outFolder: Folder,
  file: Path,
  _workspace: Workspace,
  _packageId: LocalPackageId,
  _targetName: string,
):
  Promise<void>
{
  const emitter = new TopLevelCodeEmitter('  ');
  const moduleEmitterSet = new Set<ModuleEmitter>();
  
  // TODO create emitters.
  
  for (const moduleEmitter of moduleEmitterSet) {
    moduleEmitter.emitSkeletons();
  }
  
  emitter.emit('\n\n');
  
  for (const moduleEmitter of moduleEmitterSet) {
    moduleEmitter.emitInitializers();
  }
  
  outFolder.writeFile(file, outFileTemplate(emitter.getCode()));
}
