/*/
  This is the only file in the entire project that is allowed
  to use global state and access things that should not be
  accessible without an explicitly given reference, eg. files.
/*/
import * as Path from 'path';
import { fileURLToPath } from 'url';

import { CompileServer } from "./compile-server.js"
import { exit } from "./utils/exit.js"
import { SingleModuleProvider } from "./module-provider.js"
import { ExecutionContext } from "./program/execution-context.js"
import { Repl } from "./repl.js"
import { Folder } from "./utils/fs.js"
import { Web } from "./compile-targets/targets.js"


const __filename = fileURLToPath(import.meta.url);
const __dirname = Path.dirname(__filename);


const [ ,, expr = null, ...rest ] = process.argv

if (0 < rest.length) exit('Expected zero or one argument.');


const executionContext = new ExecutionContext();

if (expr === null) {
  // TODO make sure `hyloa < 'script.hyloa'` works.
  new Repl(process.stdin, process.stdout, executionContext);
} else {
  const server = new CompileServer(
    new SingleModuleProvider(expr)
  );
  
  // This is what should be there, but let's implement the
  // interpreter in Hyloa.
  // server.runMain(executionContext)
  
  server.compile(
    new Folder(
      __dirname + '/local/hyloa-out/',
      'I solemnly swear I only call this in `hrt0.ts`',
    ),
    new Web(), // No customization so far.
  );
}