#!/usr/bin/env node

/*/
  This is the only file in the entire project that is allowed
  to use global state and access things that should not be
  accessible without an explicitly given reference, eg. files.
/*/

import { promises } from 'fs';
import prompts from 'prompts';

import { Workspace } from './workspace.js'
import { exit } from './utils/exit.js'
import { ExecutionContext } from './runtime/execution-context.js'
import { Repl } from './repl.js'
import { Folder } from './utils/fs.js'
import { isKebabName } from './utils/is-kebab-name.js';


/*/
  So far, these usages are planned:
  `hyloa` -- Prints some basic info
  `hyloa repl` -- Opens REPL
  `hyloa repl < "// A hyloa program executed in REPL\nlet x := [...]"`
  `hyloa compile outFolderPath projectName packageName targetName`
  `hyloa run projectName packageName ...args`
  `hyloa create workspace|project|package`
  
  TODO what about the arguments? Eg. `@file(../fs/path)`?
/*/

const [ , commandName, subcommandName = null, ...args ] = process.argv
const cwd = process.cwd();

const allowedCommandNames = [ 'hyloa', 'hyloa-live' ];

if (!allowedCommandNames.some(name => commandName?.endsWith(name))) {
  exit('The command name must be either "hyloa" or "hyloa-live".', commandName);
}

function createWorkspace() {
  return new Workspace(
    new Folder(
      process.cwd(),
      'I solemnly swear I only call this in `hrt0.ts`',
    ),
  );
}

async function compileCommandFn() {
  if (args.length !== 4) exit('Expected four args. Try `hyloa help compile`.');
  
  const [ outFolderPathArg, projectName, packageName, targetName ] =
    args as [ string, string, string, string ];
  
  const outFolderPath = outFolderPathArg.match(/^@folder\[(?<path>[\w/.-]*)\]$/)?.groups?.path
  
  if (outFolderPath === undefined) {
    exit(`Path must be a folder (eg. \`@folder(out)\`), instead got: ${outFolderPathArg}`);
  }
  
  const errors = await createWorkspace().compileProgram(
    new Folder(
      outFolderPath,
      'I solemnly swear I only call this in `hrt0.ts`',
    ),
    projectName,
    packageName,
    targetName,
  );
  
  if (!Array.isArray(errors) || 0 <= errors.length) {
    exit('Error(s) found during compilation:', errors);
  }
}

async function initWorkspace(): Promise<never> {
  await Promise.all([
    promises.mkdir(cwd + '/projects', { recursive: true }),
    promises.mkdir(cwd + '/out', { recursive: true }),
    promises.mkdir(cwd + '/lib', { recursive: true }),
  ]);
  
  exit('Created an empty workspace.');
}

const packageMainModule =
`///
  Entrypoint to the application.
///

import 'stdlib/io' as { WriteStream };

lib-export class makeMain {
  out: WriteStream;
  
  constructor({
    out: WriteStream,
  }) {
    this.out = out;
  }
  
  run() {
    nowait out.write('Hello, world!\n');
  }
}
`;

async function initPackage(projectName: string): Promise<string> {
  const { packageName } = await prompts([
    {
      message: 'Package name:',
      type: 'text',
      name: 'packageName',
      validate(value) {
        return isKebabName(value) || 'A package name must be kebab-cased and at least 3 characters long.';
      }
    },
  ]);
  
  await promises.mkdir(`${cwd}/projects/${projectName}/${packageName}`);
  
  await Promise.all([
    promises.writeFile(`${cwd}/projects/${projectName}/${packageName}/package.json`,
      JSON.stringify({
        defaultRegistry: null,
        registries: {},
        
        publishTo: null,
        
        targets: {},
        
        dependencies: {},
        devDependencies: {},
      }, null, 2),
    ),
    promises.writeFile(
      `${cwd}/projects/${projectName}/${packageName}/main.hyloa`,
      packageMainModule,
    ),
  ]);
  
  return packageName;
}

async function initProject(): Promise<void> {
  const { projectName } = await prompts([
    {
      type: 'text',
      name: 'projectName',
      message: 'Project name:',
      validate(value) {
        return isKebabName(value) || 'A project name must be kebab-cased and at least 3 characters long.';
      }
    },
  ]);
  
  await promises.mkdir(cwd + '/projects/' + projectName, { recursive: true }),
  
  await promises.writeFile(`${cwd}/projects/${projectName}/project.json`,
    JSON.stringify({
      registries: {},
      defaultRegistry: null,
    }, null, 2),
  );
  
  console.log('Created an empty project. Let\'s create a package inside it.');
  
  for (let createPackage = true; createPackage;) {
    const packageName = await initPackage(projectName);
    
    ({ createPackage } = await prompts([
      {
        type: 'confirm',
        name: 'createPackage',
        message: `Created the package ${packageName}. Create another package?`,
      }
    ]));
  }
}

function initCommandFn() {
  const [ subcommand ] = args;
  
  if (subcommand === undefined) {
    exit('Expected exactly one argument. Try `hyloa help init`.');
  }
  
  switch (subcommand) {
    case 'workspace': initWorkspace(); break;
    case 'project': initProject(); break;
    default:
      exit(`Subcommand must be either "workspace" or "project", not "${subcommand}".`);
  }
}

function runCommandFn() {
  if (args.length < 2) exit('Expected at least two args. Try `hyloa help run`.');
  
  const [ projectName, packageName, ...programArgs ] =
    args as [ string, string, ...string[] ];
  
  // TODO parse programArgs.
  
  createWorkspace().runProgram(projectName, packageName, undefined, programArgs);
}

type Command = {
  fn(): void;
  args: string | null;
  description: string | null;
};

type CommandMap = Record<string, Command>;

function fixCommandMapType<T extends Record<string, Command>>(t: T): T & CommandMap {
  return t;
}

/*/
  TODO `hyloa run path/to/file.hyloa`. This cannot be
  done with `hyloa eval < path/to/file.hyloa`, because
  the latter would mess up relative imports.
/*/

const commands = fixCommandMapType({
  eval: {
    fn: evalCommandFn,
    args: 'hyloa eval',
    description: ''
      + 'Opens an interactive Hyloa interpreter (REPL).\n'
      + '\n'
      + 'Tip: you can also use the REPL like this:\n'
      + 'hyloa eval <<< "let x = 42; _print(x);"'
      ,
  },
  compile: {
    fn: compileCommandFn,
    // TODO if inside a project/package, don't require their names.
    args: 'hyloa compile (outFolderPath) (projectName) (packageName) (targetName)',
    description: ''
     + 'Compiles a package.\n'
     + '\n'
     + 'The command expects to be called from the workspace folder.\n'
     + '\n'
     + 'Example usage: `hyloa compile @folder(out/foobar) foo bar web`\n'
     ,
  },
  help: {
    fn: helpCommandFn,
    args: 'hyloa help [command]',
    description: ''
      + 'Displays help for a particular [command]. If [command] is '
      + 'not provided, prints the default help message, including '
      + 'a list of all commands.'
      ,
  },
  init: {
    fn: initCommandFn,
    args: 'hyloa init ("workspace" | "project")', // TODO init package; single-package projects.
    description: ''
      + '`init workspace` makes the current (empty) folder into a workspace.'
      + '\n'
      + '`init project` interactively creates a new empty project. '
      + 'The command assumes the current folder is a workspace.\n'
      + '\n'
      + 'For more about the folder structure used by Hyloa, TODO link to docs'
      ,
  },
  run: {
    fn: runCommandFn,
    args: 'hyloa run (projectName) (packageName) (...programArgs)',
    description: 'Runs a program. TODO details.\n',
  },
});

const subcommandNames = Object.keys(commands)
  .filter(name => !name.startsWith('-'))
;

function evalCommandFn() {
  const repl = new Repl(process.stdin, process.stdout);
  
  repl.loop({
    // TODO default variables like fs, Hyloa.version, _print, etc
    executionContext: new ExecutionContext(),
    printPrompts: !!process.stdin.isTTY,
  });
}

function helpCommandFn() {
  if (2 <= args.length) {
    exit('Expected at most 1 argument. Usage:\n' + commands.help.args);
  }
  
  if (args.length === 1) {
    const [ commandName ] = args as [ string ];
    const command = commands[commandName];
    
    if (!command) {
      exit(`Unknown command "${commandName}".\n`
        + `Available commands: ${subcommandNames.join(', ')}.`);
    }
    
    exit('Usage: ' + command.args + '\n\n' + command.description);
  }
  
  exit(`Commands:
hyloa example-command (requiredParameter) [optionalParameter]
${Object.values(commands)
  .filter((command) => command.args !== null)
  .map((command) => command.args + '\n')
  .join('')
}
You can use the "help" command to get more details about a particular command.`);
}

if (subcommandName === null) {
  exit(''
    + 'Hyloa compiler version: TODO\n'
    + 'Official website: https://TODO.com\n'
    + 'Use `hyloa help` for a list of commands.',
  );
}

const command = commands[subcommandName];

if (command === undefined) {
  exit(`Unknown command: "${subcommandName}". Try \`hyloa help\`.`);
}

command.fn();
