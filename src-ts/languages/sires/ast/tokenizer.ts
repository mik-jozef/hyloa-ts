import { createTokenizer } from "../../create-tokenizer.js";

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

export const siresTokenizer = createTokenizer(tokenStringArray);
