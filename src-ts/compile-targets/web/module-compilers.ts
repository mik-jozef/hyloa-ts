import { Module } from "../../program/modules";
import { CodeEmitter } from "./code-emitters";

export class moduleCompilers {
  constructor(
    private module: Module,
    private emitter: CodeEmitter
  ) {}
  
  emitSkeletons(): void {}
  
  emitInitializers(): void {}
}