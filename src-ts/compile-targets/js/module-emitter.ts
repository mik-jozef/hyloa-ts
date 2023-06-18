import { HyloaModuleAst } from "../../languages/hyloa/ast/hyloa-module-ast";
import { Module } from "../../languages/module";
import { exit } from "../../utils/exit";

// In hyloa, support UFCS, and just have the emit[X] functions.
export class ModuleEmitter {
  constructor(
    public module: Module,
  ) {}
  
  emitSkeletons(): void {
    switch (this.module.ast.constructor) {
      case HyloaModuleAst:
        const ast = this.module.ast as HyloaModuleAst;
        
        ast.members.forEach(({ member }) => {
          
        });
      default:
        exit('Unimplemented AST type:', this.module.ast.constructor.name);
    }
  }
  
  emitInitializers(): void {}
}