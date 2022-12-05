import { programs, projects } from "../../programs/projects";
import { folders, paths } from "../../utils/fs";
import { topLevelCodeEmitters } from "./code-emitters";
import { ModuleEmitter, moduleEmitters } from "./module-compilers";


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
  outFolder: folders,
  file: paths,
  project: projects,
  program: programs,
):
  Promise<void>
{
  const emitter = new topLevelCodeEmitters('  ');
  const moduleEmitterSet = new Set<ModuleEmitter>();
  
  // TODO
  for (const pkg of project.packages.values()) {
    for (const module of program.modules.values()) {
      moduleEmitterSet.add(new moduleEmitters(module, emitter));
    }
  }
  
  for (const moduleEmitter of moduleEmitterSet) {
    moduleEmitter.emitSkeletons();
  }
  
  emitter.emit('\n\n');
  
  for (const moduleEmitter of moduleEmitterSet) {
    moduleEmitter.emitInitializers();
  }
  
  outFolder.writeFile(file, outFileTemplate(emitter.getCode()));
}
