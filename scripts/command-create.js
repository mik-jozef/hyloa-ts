/*/
  This file, when executed, creates the command `hyloa-live`,
  which allows one to run the code built in this repo.
  
  `hyloa-live` serves for debugging, and removes the need
  for installation of (a published version of) `hyloa`.
  
  An argument can be provided to create a command with a longer
  name: `node command-create.js asdf` will create the command
  `hyloa-live-asdf`.
/*/

import { mkdirSync, writeFileSync } from 'fs';
import { dirname } from 'path';
import { homedir as getHomeFolder } from 'os';
import { fileURLToPath } from 'url';

if (![ 2, 3 ].includes(process.argv.length)) {
  process.exit('There can only be one (optional) argument.');
}

const cmdNameSuffix = process.argv.length === 3 ? `-${process.argv[2]}` : '';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const homeFolder = getHomeFolder();
const binFolder = homeFolder + '/bin';

const repoRootFolder = dirname(__dirname);

const filePath = binFolder + '/hyloa-live' + cmdNameSuffix;
const file = ''
  + '#!/usr/bin/env node\n'
  + '\n'
  + `import("${repoRootFolder}/local/out/hrt0.js");\n`
;

mkdirSync(binFolder, { recursive: true });

writeFileSync(filePath, file, { mode: "766" });

console.log('Created the command "hyloa-live".');
console.log('You can now use this command (assuming your `~/bin` folder is in your PATH env variable).');
