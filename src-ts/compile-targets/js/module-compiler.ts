import { Module } from "../../languages/module";

// In hyloa, support UFCS, and just have the emit[X] functions.
export class ModuleEmitter {
  constructor(
    public module: Module,
  ) {}
  
  emitSkeletons(): void {}
  
  emitInitializers(): void {}
}