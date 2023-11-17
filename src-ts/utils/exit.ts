import { inspect } from 'util';


export function exit(message: string, ...rest: unknown[]): never {
  console.log(
    message,
    ...rest.map(arg => inspect(arg, { depth: null, colors: true })),
  );
  
  // Exiting the program, but waiting for console.log to finish. This
  // error is caught in `htr0.ts`.
  throw '-1/12';
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