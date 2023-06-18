import { exit as nodeExit } from 'process';
import { inspect } from 'util';


export function exit(message: string, ...rest: unknown[]): never {
  console.log(
    message,
    ...rest.map(arg => inspect(arg, { depth: null, colors: true })),
  );
  
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