import { ReadStream, WriteStream } from "tty";
import { createInterface } from "readline";

import { Workspace } from "./workspace.js";
import { exit } from "./utils/exit.js";
import { SingleModuleProvider } from "./module-provider.js";
import { ExecutionContext } from "./runtime/execution-context.js";
import { LocalPackageId } from "./languages/package.js";

type ReplOptions = {
  executionContext: ExecutionContext,
  printPrompts: boolean,
};

export class Repl {
  server = new Workspace(new SingleModuleProvider(new LocalPackageId('repl', 'repl'), ''));
  
  constructor(
    private inStream: ReadStream,
    private outStream: WriteStream,
  ) {}
  
  async loop({ executionContext: _TODO, printPrompts }: ReplOptions) {
    const reader = createInterface({
      input: this.inStream,
      output: this.outStream,
    })
    
    printPrompts && this.outStream.write(
      'Hyloa REPL (experimental and in development). Ctrl + Enter to evaluate\n> ',
    );
    
    for await (const _input of reader) {
      // TODO
      
      exit('REPL is not implemented yet.');
    }
  }
}