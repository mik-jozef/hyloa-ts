import { programs } from "../languages/projects.js";
import { exit } from "../utils/exit.js";
import { Folder, paths } from "../utils/fs.js";
import { compile } from "./web/-.js";


export type Target = targets;
export abstract class targets {
  abstract compile(outFolder: Folder, program: programs): Promise<void>
}

/*/
  Web assumes that the whole app is written in Hyloa.
  It may emit whatever code it wants as long as its
  behavior is in agreement with the specification.
  
  The specification may ask for things that work very
  differently from html5 & friends. Some examples:
  
  0. A hyloa app is offline-first (the compiled app
     will set up service workers, and so on)
  1. Color transitions are animated by default.
  
  TODO The specification is yet to be written.
  TODO this comment describes a future state of things.
/*/
export type Web = webTarget;
export class webTarget extends targets {
  constructor(
    public outFilePath = new paths([ 'local' ], 'out.html' ),
  ) { super(); }
  
  async compile(outFolder: Folder, program: programs): Promise<void> {
    return compile(outFolder, this.outFilePath, program);
  }
}

/*/
  WebRaw tries to emit code that is as close to the original
  as possible, and doesn't do anything extra.
  
  This target does *NOT* conform to the specification.
  For example, dynamic stack recursion is not supported
  since JavaScript does not support it.
  
  TODO this comment describes a future state of things.
/*/
export class WebRaw extends targets {
  async compile(_outFolder: Folder, _program: programs): Promise<void> {
    exit('Target "WebRaw" is not supported yet.')
  }
}


type NodeRawAll = Pick<NodeJs, 'version'>;
type NodeRaw = Partial<NodeRawAll>;

export type NodeJs = nodeJsTargets;
export class nodeJsTargets extends targets {
  version: '18' = '18';
  outFilePath = new paths([ 'local' ], 'out.mjs' );
  
  constructor(options: NodeRaw) {
    super();
    
    Object.assign(this, options);
  }
  
  compile(outFolder: Folder, program: programs): Promise<void> {
    throw new Error("Method not implemented.");
  }
}

/*/
  // Pipe dreams follow
  class llvmTargets {}
  class windowsExeTargets {}
  class macOsBundeTargets {}
  class androidAppTargets {}
  // TODO what can I use for Linux? Elf?
  // class somethingLinuxeyTargets {}

  // Pipe dreams squared
  class amd64Targets {}
  class avrTargets {}
/*/
