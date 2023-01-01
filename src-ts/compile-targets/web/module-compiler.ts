import { Module } from "../../languages/module";
import { CodeEmitter } from "./code-emitter";

export class ModuleEmitter {
  constructor(
    private module: Module,
    private emitter: CodeEmitter
  ) {}
  
  emitSkeletons(): void {}
  
  emitInitializers(): void {}
}