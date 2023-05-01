#!/usr/bin/env node

/*/
  This is the only file in the entire project that is allowed
  to use global state and access things that should not be
  accessible without an explicitly given reference, eg. files.
/*/

import { mkdirSync } from 'fs';

import { Workspace } from "./workspace.js"
import { exit } from "./utils/exit.js"
import { ExecutionContext } from "./languages/runtime/execution-context.js"
import { Repl } from "./repl.js"
import { Folder } from "./utils/fs.js"


/*/
  So far, these usages are planned:
  `hyloa` -- Opens REPL
  `hyloa < "// A hyloa program executed in REPL\nlet x := [...]"`
  `hyloa compile outFolderPath projectName packageName targetName`
  `hyloa run projectName packageName ...args`
  `hyloa create workspace|project|package`
  
  TODO what about the arguments? Eg. `@file(../fs/path)`?
/*/

const [ , commandName, subcommandName = null, ...args ] = process.argv

const commandNames: unknown[] = [ 'hyloa', 'hyloa-live' ];

if (!commandNames.includes(commandName)) {
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

function compileCommandFn() {
  if (args.length !== 4) exit('Expected four args. Try `hyloa help compile`.');
  
  const [ outFolderPath, projectName, packageName, targetName ] =
    args as [ string, string, string, string ];
  
  createWorkspace().compileProgram(
    new Folder(
      outFolderPath,
      'I solemnly swear I only call this in `hrt0.ts`',
    ),
    projectName,
    packageName,
    targetName,
  );
}

function initWorkspace(path: string): never {
  mkdirSync(path + '/projects', { recursive: true });
  mkdirSync(path + '/programs', { recursive: true });
  mkdirSync(path + '/lib', { recursive: true });
  
  exit('Created an empty workspace.');
}

async function initProject(): never {}

function initCommandFn() {
  const [ subcommand ] = args;
  
  if (subcommand === undefined) {
    exit('Expected exactly one argument. Try `hyloa help init`.');
  }
  
  switch (subcommand) {
    case 'workspace': initWorkspace();
    case 'project': initProject();
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

const commands = fixCommandMapType({
  compile: {
    fn: compileCommandFn,
    args: 'hyloa compile (outFolderPath) (projectName) (packageName) (targetName)',
    description: 'Compiles a package. TODO details.\n',
  },
  help: {
    fn: helpCommandFn,
    args: 'hyloa help [command]',
    description: ''
      + 'Displays help for a particular [command]. If [command] is '
      + 'not provided, prints the default help message.\n'
      ,
  },
  init: {
    fn: initCommandFn,
    args: 'hyloa init ("workspace" | "project")',
    description: ''
      + '`init workspace` makes the current (empty) folder into a workspace.'
      + '\n'
      + '`init project` interactively creates a new empty project. '
      + 'The command assumes the current folder is a workspace.\n'
      + '\n'
      + 'For more about the folder structure used by Hyloa, TODO link to docs\n'
      ,
  },
  run: {
    fn: runCommandFn,
    args: 'hyloa run (projectName) (packageName) (...programArgs)',
    description: 'Runs a program. TODO details.\n',
  },
  '-h': { fn: helpCommandFn, args: null, description: null },
  '--help': { fn: helpCommandFn, args: null, description: null },
});

const subcommandNames = Object.keys(commands)
  .filter(name => !name.startsWith('-'))
;

function helpCommandFn() {
  if (subcommandName !== 'help' && args.length !== 0) {
    exit('Unexpected arguments:', args);
  }
  
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
    
    exit(command.args + '\n\n' + command.description);
  }
  
  exit(`REPL usage:
hyloa  # Opens REPL.

Tip: you can also use the REPL like this:
hyloa < "let x = 42; _print(x);"

Commands:
hyloa example-command (requiredParameter) [optionalParameter]
${Object.values(commands)
  .filter((command) => command.args !== null)
  .map((command) => command.args + '\n')
  .join('')
}
You can use the "help" command to get more details about a particular command.

Hyloa version: TODO
Official website: https://TODO.com`);
}

if (subcommandName === null) {
  // TODO make sure `hyloa < 'script.hyloa'` works.
  new Repl(process.stdin, process.stdout, {
    executionContext: new ExecutionContext(), // TODO default variables like fs, Hyloa.version, etc
    printPrompts: !!process.stdin.isTTY,
  });
  
  process.exit();
}

const command = commands[subcommandName];

if (command === undefined) {
  exit(`Unknown command: "${subcommandName}". Try \`hyloa --help\`.`);
}

command.fn();
