// A kebab-case string with at least 3 characters.
export function isKebabName(str: string): boolean {
  return 3 <= str.length && !!str.match(/[a-z](?:-?[a-z0-9])*/);
}