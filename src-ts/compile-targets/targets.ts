import { LocalPackageId } from "../languages/package";
import { Folder, Path } from "../utils/fs.js";
import { Workspace } from "../workspace";
import { compile } from "./web/.js";


export abstract class Target {
  abstract compile(
    outFolder: Folder,
    workspace: Workspace,
    packageId: LocalPackageId,
    targetName: string,
  ): Promise<void>;
}

export class Web extends Target {
  constructor(
    public outFilePath = new Path([ 'local' ], 'out.html' ),
  ) { super(); }
  
  async compile(
    outFolder: Folder,
    workspace: Workspace,
    packageId: LocalPackageId,
    targetName: string,
  ): Promise<void> {
    return compile(outFolder, this.outFilePath, workspace, packageId, targetName);
  }
}


type NodeRawAll = Pick<NodeJs, 'version'>;
type NodeRaw = Partial<NodeRawAll>;

export class NodeJs extends Target {
  version: '18' = '18';
  outFilePath = new Path([ 'local' ], 'out.mjs' );
  
  constructor(options: NodeRaw) {
    super();
    
    Object.assign(this, options);
  }
  
  compile(
    _outFolder: Folder,
    _workspace: Workspace,
    _packageId: LocalPackageId,
    _targetName: string,
  ): Promise<void> {
    throw new Error("Method not implemented.");
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
