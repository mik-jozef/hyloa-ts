import { Tokenizer as tokenizers } from 'lr-parser-typescript';

// TODO
// https://github.com/mik-jozef/carpicley/blob/main/src/parser/tokenizer.ts

export type TokenString = typeof tokenStringArray[number];
export const tokenStringArray = [
  'identifier',
  'import',
  'thelse',
  'number',
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
  '$0',
  '$1',
  '$2',
  '$3',
  '$4',
  '$5',
  '(',')','[',']','{','}','<','>',',','.','!','@','#','$', '=', '_',
  '%','^','&','*',';',':','\'','\\','|','/','?','`','~', '+', '-',
] as const;

export const lyoTokenizer = new tokenizers(tokenStringArray);

export const token = lyoTokenizer.token.bind(lyoTokenizer);
