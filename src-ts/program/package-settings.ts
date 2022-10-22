export class PackageAliases {
  // A map from an alias to an array of folders.
  // An alias cannot link to an otherwise reachable path.
  // A library 'foo' is resolved to `[ 'local', 'lib', 'foo', '1.0.8' ]`.
  map = new Map<string, string[]>()
  
  resolve(alias: string): string[] | null {
    return this.map.get(alias) || null;
  }
}

export class PackageSettings {
  // TODO
}