// @ts-ignore
type String = string; type Null = null; type Boolean = boolean; type Number = number; type BigInt = bigint; type Symbol = symbol; type Unknown = unknown; type Never = never; type Any = any; type Void = void

import { createReadStream, promises, ReadStream } from "fs";


export type FileSystemError = fileSystemErrors;
export abstract class fileSystemErrors {
  abstract path: Path;
}

export type FileNotFoundError = fileNotFoundErrors;
export class fileNotFoundErrors extends fileSystemErrors {
  constructor(
    public path: Path,
  ) { super(); }
}

export type OtherFsError = otherFsErrors;
export class otherFsErrors extends fileSystemErrors {
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


export type Path = paths;
export class paths {
  constructor(
    public folders: String[],
    public file: String | Null,
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
  
  readFile<T>(filePath: Path, fileReader: FileReaderClass<T>): Promise<T | FileSystemError>;
  readFile<T>(filePath: Path, fileReader: 'utf8'): Promise<String | FileSystemError>;
  readFile<T>(filePath: Path, fileReader: Null): Promise<Buffer | FileSystemError>;
  
  async readFile<T>(
    filePath: Path,
    fileReader: FileReaderClass<T> | 'utf8' | Null = null,
  ):
    Promise<T | Buffer | String | FileSystemError>
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
      if (e.code === 'ENOENT') return new fileNotFoundErrors(filePath);
      
      return new otherFsErrors(filePath, e);
    }
  }
  
  writeFile(filePath: Path, str: String) {
    const path = this.path + filePath.toString();
    
    return promises.writeFile(path, str);
  }
}
