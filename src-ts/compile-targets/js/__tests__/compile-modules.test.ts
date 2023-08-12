import { compileModules } from "../compile-modules";
import { NodeJS } from "../../targets";

describe('Compilation to JS', () => {
  it('compiles an empty', () => {
    expect(compileModules('', new NodeJS()))
  });
  
  it('compiles a simple module', () => {
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
    
    expect(compileModules(src, new NodeJS())).toStrictEqual(
`TODO`,
    );
  });
});