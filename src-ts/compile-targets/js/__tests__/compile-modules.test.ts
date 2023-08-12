import { compileModules } from "../compile-modules";
import { NodeJS } from "../../targets";

describe('Compilation to JS', () => {
  it('compiles an empty module', async () => {
    const out = await compileModules('', new NodeJS())

    expect(out).toStrictEqual(
`const _go = (fn, ...args) => {
  let stack = [], ret = null;
  fn(stack, ...args);
  while (stack[stack.length - 1].go) ret = stack[stack.length-1].go();
  return ret;
}





`)
  });
  
  it('compiles a simple module', async () => {
    const src =
`// An example program

let foo(a) := a;
let foo(a, b) := b;

let bar() {
  let t = 42;
  
  foo(t);
  
  return foo(4 + foo(t));
}
`;
    
    expect(await compileModules(src, new NodeJS())).toStrictEqual(
`TODO`,
    );
  });
});