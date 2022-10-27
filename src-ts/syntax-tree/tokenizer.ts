import { Tokenizer as tokenizers } from 'lr-parser-typescript';

// TODO
// https://github.com/mik-jozef/carpicley/blob/main/src/parser/tokenizer.ts

export type TokenString = typeof tokenStringArray[number];
export const tokenStringArray = [
  'identifier',
  'import',
  'return',
  'thelse',
  'number',
  'await',
  'class',
  'trait',
  'thand',
  'where',
  'else',
  'text',
  'then',
  'with',
  'All',
  'let',
  '<->',
  'as',
  'Ex',
  'fn',
  '=>',
  '<=',
  '>=',
  '!=',
  '==',
  '**',
  '++',
  '->',
  '<-',
  '..',
  '(',')','[',']','{','}','<','>',',','.','!','@','#','$', '=', '_',
  '%','^','&','*',';',':','\'','\\','|','/','?','`','~', '+', '-',
] as const;

export const tokenizer = new tokenizers(tokenStringArray);

export const token = tokenizer.token.bind(tokenizer);
