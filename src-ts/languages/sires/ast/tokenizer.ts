import { Tokenizer as tokenizers } from 'lr-parser-typescript';

export type TokenString = typeof tokenStringArray[number];
export const tokenStringArray = [
  'identifier',
  'return',
  'number',
  'await',
  'else',
  'text',
  'then',
  'All',
  'let',
  '===',
  'Ex',
  '=>',
  '->',
  '..',
  ':=',
  '<<',
  '>>',
  '(',')','[',']','{','}','<','>',',','.','!','@','#','$', '=', '_',
  '%','^','&','*',';',':','\'','\\','|','/','?','`','~', '+', '-',
] as const;

export const siresTokenizer = new tokenizers(tokenStringArray);

export const token = siresTokenizer.token;
