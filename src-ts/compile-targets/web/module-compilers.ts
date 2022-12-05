import { Module } from "../../programs/modules";
import { CodeEmitter } from "./code-emitters";

export type ModuleEmitter = moduleEmitters;
export class moduleEmitters {
  constructor(
    private module: Module,
    private emitter: CodeEmitter
  ) {}
  
  emitSkeletons(): void {}
  
  emitInitializers(): void {}
}