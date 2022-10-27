import { promises, ReadStream } from "fs";


export type BufferReader = bufferReaders;
interface bufferReaders {
  constructor(buffer: Buffer): any
}

export type StreamReader = streamReaders;
interface streamReaders {
  constructor(inStream: ReadStream): any
}

type FileReader = bufferReaders | streamReaders;

export type Path = paths;
export class paths {
  constructor(
    public folders: string[],
    public file: string | null,
  ) {}
  
  toString() {
    return '/' + this.folders.map(f => f + '/') + (this.file || '');
  }
}

// In TypeScript, you can access any file with just a string (its path).
// Hyloa is capability-based, it's gonna use Folder and File
// classes, and a program will need to be given one to be able
// to open it.
export type Folder = folders;
export class folders {
  constructor(
    // Should be without a trailing slash. Not part of Hyloa.
    private path: string,
    _: 'I solemnly swear I only call this in `hrt0.ts`',
  ) {}
  
  readFile<T extends FileReader>(filePath: Path, fileReader: FileReader): Promise<T>;
  readFile<T extends FileReader>(filePath: Path, fileReader: 'utf8'): Promise<string>;
  readFile<T extends FileReader>(filePath: Path, fileReader: null): Promise<Buffer>;
  
  readFile<T extends FileReader>(
    filePath: Path,
    fileReader: FileReader | 'utf8' | null = null,
  ):
    Promise<T | Buffer | string>
  {
    const path = this.path + filePath.toString();
    
    if (fileReader === null) return promises.readFile(path);
    if (fileReader === 'utf8') return promises.readFile(path, 'utf8');
    
    throw new Error('Unimplemented');
  }
  
  writeFile(filePath: Path, str: string) {
    const path = this.path + filePath.toString();
    
    return promises.writeFile(path, str);
  }
}
