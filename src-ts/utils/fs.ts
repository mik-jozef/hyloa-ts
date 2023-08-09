import { createReadStream, promises, ReadStream } from "fs";


export abstract class FileSystemError {
  abstract path: Path;
}

export class FileNotFoundError extends FileSystemError {
  constructor(
    public path: Path,
  ) { super(); }
}

export class OtherFsError extends FileSystemError {
  constructor(
    public path: Path,
    public error: NodeJS.ErrnoException,
  ) { super(); }
}


interface BufferReader<T> {
  read(): T | Promise<T>;
}

interface StreamReader<T> {
  read(): T | Promise<T>;
}

/*/
  This is just a helper type, because it does not support
  being extended with a class that prefers streams.
/*/
type ReaderClassPrefersBuffer<T> = {
  new(buffer: Buffer): BufferReader<T>;
  
  preferredConstructorArgument: 'buffer';
}

/*/
  This is just a helper type, because it does not support
  being extended with a class that prefers buffers.
/*/
type ReaderClassPrefersStream<T> = {
  new(inStream: ReadStream): StreamReader<T>;
  
  preferredConstructorArgument: 'stream';
}

type ReaderClassPrefers<T> =
  ReaderClassPrefersBuffer<T> | ReaderClassPrefersStream<T>;

// These classes should be extendable in Hyloa.
export type BufferReaderClass<T> = ReaderClassPrefers<T> & {
  new(buffer: Buffer): BufferReader<T>;
}

export type StreamReaderClass<T> = ReaderClassPrefers<T> & {
  new(inStream: ReadStream): StreamReader<T>;
}

export type FileReaderClass<T> = BufferReaderClass<T> | StreamReaderClass<T>;


export class Path {
  constructor(
    public folders: string[],
    public file: string | null,
  ) {}
  
  parent(): Path {
    return this.file === null
      ? new Path(this.folders.slice(0, -1), null)
      : new Path([...this.folders], null);
  }
  
  toString() {
    return '/' + this.folders.map(f => f + '/').join('') + (this.file || '');
  }
}

// In TypeScript, you can access any file with just a string (its path).
// Hyloa is capability-based, it's gonna use FolderHandle and FileHandle
// classes, and a program will need to be given one to be able to access
// it.
export class FolderHandle {
  constructor(
    // The path should be without a trailing slash. Not part of Hyloa.
    private path: string,
    _: 'I solemnly swear I only call this in `hrt0.ts`',
  ) {}
  
  readFile<T>(filePath: Path, fileReader: FileReaderClass<T>): Promise<T | FileSystemError>;
  readFile<T>(filePath: Path, fileReader: 'utf8'): Promise<string | FileSystemError>;
  readFile<T>(filePath: Path, fileReader: null): Promise<Buffer | FileSystemError>;
  
  async readFile<T>(
    filePath: Path,
    fileReader: FileReaderClass<T> | 'utf8' | null = null,
  ):
    Promise<T | Buffer | string | FileSystemError>
  {
    try {
      const path = this.path + filePath.toString();
      
      const fileReaderOptions: unknown[] = [ 'utf8', null ];
      
      if (fileReaderOptions.includes(fileReader)) {
        return await promises.readFile(path, fileReader as 'utf8' | null);
      }
      
      const fileReaderClass = (fileReader as FileReaderClass<T>);
      
      if (fileReaderClass.preferredConstructorArgument === 'buffer') {
        const buffer = await promises.readFile(path, null);
        
        return (new fileReaderClass(buffer)).read();
      } else {
        const stream = createReadStream(path)
        
        return (new fileReaderClass(stream)).read();
      }
    } catch (e: any) {
      if (e.code === 'ENOENT') return new FileNotFoundError(filePath);
      
      return new OtherFsError(filePath, e);
    }
  }
  
  async writeFile(filePath: Path, str: string) {
    const path = this.path + filePath.toString();
    const parentPath = this.path + filePath.parent().toString();
    
    await promises.mkdir(parentPath, { recursive: true });
    
    return promises.writeFile(path, str);
  }
}
