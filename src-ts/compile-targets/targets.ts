import { Program } from "../program/program.js";
import { exit } from "../utils/exit.js";
import { Folder } from "../utils/fs.js";


export abstract class Target {
  abstract compile(outFolder: Folder, program: Program): Promise<void>
}

/*/
  Web assumes that the whole app is written in Hyloa.
  It may emit whatever code it wants as long as its
  behavior is in agreement with the specification.
  
  That includes things the programmer did not explicitly
  ask for, like for instance setting up "Cache-Control"
  headers or making color transitions animated.
/*/
export class Web extends Target {
  constructor(
    public outFile = 'out.html',
  ) { super(); }
  
  async compile(_outFolder: Folder, _program: Program): Promise<void> {
    // TODO
  }
}

/*/
  WebRaw tries to emit code that is as close to the original
  as possible, and doesn't do anything extra.
/*/
export class WebRaw extends Target {
  async compile(_outFolder: Folder, _program: Program): Promise<void> {
    exit('Target "WebRaw" is not supported yet.')
  }
}

/*/
  // Pipe dreams follow
  class Llvm {}
  class WindowsExe {}
  class MacOsBunde {}
  class AndroidApp {}
  // TODO what can I use for Linux? Elf?
  // class SomethingLinuxey {}

  // Pipe dreams squared
  class Amd64 {}
  class Avr {}
/*/
