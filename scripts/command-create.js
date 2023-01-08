import { mkdirSync, writeFileSync } from 'fs';
import { dirname } from 'path';
import { homedir as getHomeFolder } from 'os';
import { fileURLToPath } from 'url';


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const homeFolder = getHomeFolder();
const binFolder = homeFolder + '/bin';

const repoRootFolder = dirname(__dirname);

const filePath = binFolder + '/hyloa-live';
const file = ''
  + '#!/usr/bin/env node\n'
  + '\n'
  + `import("${repoRootFolder}/local/out/hrt0.js");\n`
;

mkdirSync(binFolder, { recursive: true });

writeFileSync(filePath, file, { mode: "766" });

console.log('Created the command "hyloa-live".');
console.log('You can now use this command (assuming your `~/bin` folder is in your PATH env variable).');
