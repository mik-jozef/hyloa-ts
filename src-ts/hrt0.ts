/*/
  This is the only file in the entire project that is allowed
  to use global state and access things that should not be
  accessible without an explicitly given reference, eg. files.
/*/

import { Workspace } from "./workspace.js"
import { exit } from "./utils/exit.js"
import { ExecutionContext } from "./languages/runtime/execution-context.js"
import { Repl } from "./repl.js"
import { Folder } from "./utils/fs.js"


/*/
  So far, these usages are planned:
  `hyloa` -- Opens REPL
  `hyloa < "// A hyloa program executed in REPL\n[...]"`
  `hyloa compile outFolderPath projectName packageName targetName`
  `hyloa run projectName packageName ...args`
  `hyloa create workspace|project|package`
  
  TODO what about the arguments? Eg. `@file(../fs/path)`?
/*/

const [ ,, command = null, ...args ] = process.argv

function createWorkspace() {
  return new Workspace(
    new Folder(
      process.cwd(),
      'I solemnly swear I only call this in `hrt0.ts`',
    ),
  );
}

switch (command) {
  case null:
    // TODO make sure `hyloa < 'script.hyloa'` works.
    new Repl(process.stdin, process.stdout, {
      executionContext: new ExecutionContext(), // TODO default variables like fs, Hyloa.version, etc
      printPrompts: !!process.stdin.isTTY,
    });
    
    break;
  case 'compile': {
    if (args.length !== 4) exit('Expected four args. TODO usage: ...');
    
    const [ outFolderPath, projectName, packageName, targetName ] = args;
    
    createWorkspace().compileProgram(
      new Folder(
        outFolderPath,
        'I solemnly swear I only call this in `hrt0.ts`',
      ),
      projectName,
      packageName,
      targetName,
    );
    
    break;
  }
  case 'run': {
    if (args.length < 2) exit('Expected at least two args. TODO usage: ...');
    
    const [ projectName, packageName, ...programArgs ] = args;
    
    // TODO parse programArgs.
    
    createWorkspace().runProgram(projectName, packageName, undefined, programArgs);
    
    break;
  }
  default:
    console.log('Unknown command:', command);
}
