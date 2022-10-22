import * as process from 'process'

export function exit(message: string, ...rest: unknown[]): never {
  console.log(message, ...rest);
  
  process.exit();
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