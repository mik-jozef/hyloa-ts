import { exit as nodeExit } from 'process';

export function exit(message: string, ...rest: unknown[]): never {
  console.log(message, ...rest);
  
  nodeExit();
}

export async function fuckThrow<T>(fn: () => T):
  Promise<T | NodeJS.ErrnoException>
{
  try {
    return await fn();
  } catch (e: any) {
    return e;
  }
}