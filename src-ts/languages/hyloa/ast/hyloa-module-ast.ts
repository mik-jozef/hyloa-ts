import { Caten, Match, Maybe, Or, Repeat, SyntaxTreeNode, Token } from 'lr-parser-typescript';
import { ModuleAst } from '../../module.js';

import { ClassLiteral } from './class-literal.js';
import { HyloaImportAst } from './hyloa-import-ast.js';
import { LetDeclaration, LetDeclarationHead } from './let-declaration.js';

import { token } from './tokenizer.js';

// This is here only bc JS/TS does not handle circular class references.
import "./expressions.js";


export type ModuleDeclaration = LetDeclaration | LetDeclarationHead | ClassLiteral;

export class ModuleMember extends SyntaxTreeNode {
  isPrivate!: Token<'private'> | null;
  member!: ModuleDeclaration;
  
  static rule = new Caten(
    new Maybe(
      new Match(false, 'isPrivate', token('private')),
    ),
    new Or(
      new Match(false, 'member', LetDeclaration),
      new Match(false, 'member', LetDeclarationHead),
      new Match(false, 'member', ClassLiteral),
    ),
  );
}

export class HyloaModuleAst extends ModuleAst {
  imports!: HyloaImportAst[];
  
  members!: ModuleMember[];

  static rule = new Caten(
    new Repeat(
      new Match(true, 'imports', HyloaImportAst),
    ),
    new Repeat(
      new Match(true, 'members', ModuleMember),
    ),
  );
}
