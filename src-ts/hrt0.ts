/*/
  This is the only file in the entire project that is allowed
  to use global state and access things that should not be
  accessible without an explicitly given reference, eg. files.
/*/
import * as Path from 'path';
import { fileURLToPath } from 'url';

import { workspaces } from "./workspaces.js"
import { exit } from "./utils/exit.js"
import { singleModuleProviders } from "./module-providers.js"
import { executionContexts } from "./languages/runtime/execution-contexts.js"
import { Repl } from "./repls.js"
import { folders } from "./utils/fs.js"


const __filename = fileURLToPath(import.meta.url);
const __dirname = Path.dirname(__filename);


const [ ,, command = null, programName = null, ...argRest ] = process.argv

// So far, these usages are planned:
// `hyloa` -- Opens REPL
// `hyloa < "// A hyloa program executed in REPL\n[...]"`
// `hyloa compile programName`
// `hyloa run programName` TODO what about the arguments? Eg. `@file(../fs/path)`?
// `hyloa init` -- TODO if empty, makes the current directory into a project, interactively. Asks whether to run git in `/src`.

if (0 < argRest.length || command !== null && programName === null) {
  exit('Expected zero or two arguments.');
}


switch (command) {
  case null:
    // TODO make sure `hyloa < 'script.hyloa'` works.
    new Repl(process.stdin, process.stdout, {
      executionContext: new executionContexts(), // TODO default variables like fs, Hyloa.version, etc
      printPrompts: !!process.stdin.isTTY,
    });
    
    break;
  case 'compile': {
    const server = new workspaces(
      new singleModuleProviders(command)
    );
    
    server.compile(
      new folders(
        __dirname + '/local/hyloa-out/',
        'I solemnly swear I only call this in `hrt0.ts`',
      ),
    );
    
    break;
  }
  case 'run': {
    const server = new workspaces(
      new singleModuleProviders(command)
    );
    
    server.runMain(); // TODO arguments
    
    break;
  }
  default:
    console.log('Unknown command:', command);
}
