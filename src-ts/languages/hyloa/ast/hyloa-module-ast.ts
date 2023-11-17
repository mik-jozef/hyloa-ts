import { Caten, Match, MatchArr, Maybe, Or, Repeat, SyntaxTreeNode, Token } from 'lr-parser-typescript';
import { ModuleAst } from '../../module.js';

import { ClassLiteral } from './class-literal.js';
import { HyloaImportAst } from './hyloa-import-ast.js';
import { LetDeclaration, LetDeclarationHead } from './let-declaration.js';

// This is here only bc JS/TS does not handle circular class references.
import "./expressions.js";


export type ModuleDeclaration = LetDeclaration | LetDeclarationHead | ClassLiteral;

export class ModuleMember extends SyntaxTreeNode {
  isPrivate!: Token<'private'> | null;
  member!: ModuleDeclaration;
  
  static pattern = new Caten(
    new Maybe(
      new Match('isPrivate', 'private'),
    ),
    new Or(
      new Match('member', LetDeclaration),
      new Match('member', LetDeclarationHead),
      new Match('member', ClassLiteral),
    ),
  );
}

export class HyloaModuleAst extends ModuleAst {
  imports!: HyloaImportAst[];
  
  members!: ModuleMember[];
  
  static pattern = new Caten(
    new Repeat(
      new MatchArr('imports', HyloaImportAst),
    ),
    new Repeat(
      new MatchArr('members', ModuleMember),
    ),
  );
}
