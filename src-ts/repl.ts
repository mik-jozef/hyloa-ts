import { ReadStream, WriteStream } from "tty";

import { CompileServer } from "./compile-server.js";
import { exit } from "./utils/exit.js";
import { SingleModuleProvider } from "./module-provider.js";
import { ExecutionContext } from "./program/execution-context.js";

export class Repl {
  server = new CompileServer(new SingleModuleProvider(''))
  
  constructor(
    private inStream: ReadStream,
    private outStream: WriteStream,
    _executionContext: ExecutionContext,
  ) {
    this.loop();
  }
  
  async loop() {
    this.inStream.setEncoding('utf8');
    
    this.outStream.write('Hyloa REPL (experimental and in development). Ctrl + Enter to evaluate\n> ');
    
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