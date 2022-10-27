import { ReadStream, WriteStream } from "tty";

import { workspaces } from "./workspaces.js";
import { exit } from "./utils/exit.js";
import { singleModuleProviders } from "./module-providers.js";
import { executionContexts } from "./program/runtime/execution-contexts.js";

type ReplOptions = {
  executionContext: executionContexts,
  printPrompts: boolean,
};

export class Repl {
  server = new workspaces(new singleModuleProviders(''))
  
  constructor(
    private inStream: ReadStream,
    private outStream: WriteStream,
    options:
      ReplOptions,
  ) {
    this.loop(options);
  }
  
  async loop({ executionContext: _TODO, printPrompts }: ReplOptions) {
    this.inStream.setEncoding('utf8');
    
    printPrompts && this.outStream.write(
      'Hyloa REPL (experimental and in development). Ctrl + Enter to evaluate\n> ',
    );
    
    for await (const _input of this.inStream) {
      // TODO
      
      exit('REPL is not implemented yet.\n' +
        'Expected usage: provide the code to be executed, in a single argument.\n' +
        '\n' +
        'Example: npm run-script --silent run "import X; let x = 42;"'
      );
    }
  }
}