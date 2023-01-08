import { unlinkSync } from 'fs';
import { homedir as getHomeFolder } from 'os';


const homeFolder = getHomeFolder();
const binFolder = homeFolder + '/bin';

const filePath = binFolder + '/hyloa-live';

unlinkSync(filePath);

console.log('Deleted the command "hyloa-live".');
