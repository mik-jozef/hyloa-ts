/*/
  This file, when executed, undoes the actions of `command-create`.
  An optional argument is accepted, with the same semantics.
/*/

import { unlinkSync } from 'fs';
import { homedir as getHomeFolder } from 'os';

if (![ 2, 3 ].includes(process.argv.length)) {
  process.exit('There can only be one (optional) argument.');
}

const cmdNameSuffix = process.argv.length === 3 ? `-${process.argv[2]}` : '';


const homeFolder = getHomeFolder();
const binFolder = homeFolder + '/bin';

const filePath = binFolder + '/hyloa-live' + cmdNameSuffix;

unlinkSync(filePath);

console.log('Deleted the command "hyloa-live".');
