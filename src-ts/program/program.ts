import { Module } from "./module";


export class Program {
  // Uses strings instead of ModulePaths to avoid duplicates.
  modules = new Map<string, Module>()
  
  addModule(module: Module) {
    this.modules.set(module.path.toString(), module);
  }
}
