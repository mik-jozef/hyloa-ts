import { PackageAny } from "../languages/package";
import { FolderHandle, Path } from "../utils/fs.js";
import { Workspace } from "../workspace";
import { compileToJs } from "./js/compile-to-js.js";


export abstract class Target {
  static targetType: string;
  
  abstract compile(
    outFolder: FolderHandle,
    workspace: Workspace,
    pkg: PackageAny,
  ): Promise<void>;
}

export class Web extends Target {
  static targetType: 'web' = 'web';
  
  constructor(
    public outFilePath = new Path([], 'out.html' ),
  ) { super(); }
  
  async compile(
    outFolder: FolderHandle,
    workspace: Workspace,
    pkg: PackageAny,
  ): Promise<void> {
    return compileToJs(outFolder, this.outFilePath, workspace, pkg, this);
  }
}


type NodeRawAll = Pick<NodeJS, 'version' | 'outFilePath'>;
type NodeRaw = Partial<NodeRawAll>;

export class NodeJS extends Target {
  static targetType: 'node-js' = 'node-js';
  
  version: '18' = '18';
  outFilePath = new Path([], 'out.mjs' );
  
  constructor(options: NodeRaw = {}) {
    super();
    
    Object.assign(this, options);
  }
  
  compile(
    outFolder: FolderHandle,
    workspace: Workspace,
    pkg: PackageAny,
  ): Promise<void> {
    return compileToJs(outFolder, this.outFilePath, workspace, pkg, this);
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

export const targets = {
  [Web.targetType]: Web,
  [NodeJS.targetType]: NodeJS,
};

export type TargetType = keyof typeof targets;