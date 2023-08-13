import { Tokenizer as tokenizers } from 'lr-parser-typescript';

export type TokenString = typeof tokenStringArray[number];
export const tokenStringArray = [
  'identifier',
  'undefined',
  'private',
  'import',
  'return',
  'static',
  'thelse',
  'nowait',
  'number',
  'await',
  'class',
  'false',
  'trait',
  'thand',
  'where',
  'else',
  'null',
  'text',
  'then',
  'true',
  'with',
  'asn',
  'All',
  'let',
  '===',
  '!==',
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
  '?.',
  ':=',
  '<<',
  '>>',
  '&&',
  '||',
  '$0',
  '$1',
  '$2',
  '$3',
  '$4',
  '$5',
  '(',')','[',']','{','}','<','>',',','.','!','@','#','$', '=', '_',
  '%','^','&','*',';',':','\'','\\','|','/','?','`','~', '+', '-',
] as const;

export const hyloaTokenizer = new tokenizers(tokenStringArray);

export const token = hyloaTokenizer.token;
