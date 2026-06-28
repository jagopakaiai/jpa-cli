import { Command } from 'commander';
import { loginCommand } from './commands/login.js';
import { detectCommand } from './commands/detect.js';
import { syncCommand } from './commands/sync.js';
import { initCommand } from './commands/init.js';
import { skillsListCommand } from './commands/skills.js';
import { mcpListCommand, mcpInstallCommand } from './commands/mcp.js';
import { keysCommand } from './commands/keys.js';
import * as p from '@clack/prompts';
import pc from 'picocolors';
import fs from 'fs';
import path from 'path';

let CLI_VERSION = '1.1.2';
try {
  const pkgPath = path.resolve(__dirname, '..', 'package.json');
  if (fs.existsSync(pkgPath)) {
    CLI_VERSION = JSON.parse(fs.readFileSync(pkgPath, 'utf-8')).version || CLI_VERSION;
  }
} catch {}

const program = new Command();

program
  .name('jagopakaiai-cli')
  .description('JagoPakaiAI Command Line Interface rules synchronizer')
  .version(CLI_VERSION);

program
  .command('login')
  .description('Authenticate with your JagoPakaiAI API Key')
  .action(async () => {
    await loginCommand();
  });

program
  .command('keys')
  .argument('[provider]', 'AI provider name (gemini, openrouter, groq, jagopakaiai)')
  .argument('[key]', 'API key for the specified provider')
  .description('Manage API keys for Gemini, OpenRouter, Groq, and JagoPakaiAI')
  .action(async (provider, key) => {
    await keysCommand(provider, key);
  });

program
  .command('detect')
  .description('Scan current workspace environment and files')
  .action(async () => {
    await detectCommand();
  });

program
  .command('sync')
  .argument('[skill-name]', 'Name/slug of the skill to sync rules for')
  .description('Pull rules for a skill and synchronize in workspace')
  .action(async (skillName) => {
    await syncCommand(skillName);
  });

program
  .command('init')
  .description('Initialize project settings, detect local AI agents, and generate PRD.md')
  .action(async () => {
    await initCommand();
  });

program
  .command('skills')
  .description('List available skills and check synchronization status')
  .action(async () => {
    await skillsListCommand();
  });

program
  .command('mcp')
  .argument('[install-name]', 'Name of recommended MCP server to install')
  .description('List and install recommended Model Context Protocol (MCP) servers')
  .action(async (installName) => {
    if (installName) {
      await mcpInstallCommand(installName);
    } else {
      await mcpListCommand();
    }
  });

function printLogo() {
  const line1 = [
    "     ██╗ █████╗  ██████╗  ██████╗     ██████╗  █████╗ ██╗  ██╗ █████╗ ██╗     █████╗ ██╗",
    "     ██║██╔══██╗██╔════╝ ██╔═══██╗    ██╔══██╗██╔══██╗██║ ██╔╝██╔══██╗██║    ██╔══██╗██║",
    "     ██║███████║██║  ███╗██║   ██║    ██████╔╝███████║█████╔╝ ███████║██║    ███████║██║",
    "██   ██║██╔══██║██║   ██║██║   ██║    ██╔═══╝ ██╔══██║██╔═██╗ ██╔══██║██║    ██╔══██║██║",
    "╚█████╔╝██║  ██║╚██████╔╝╚██████╔╝    ██║     ██║  ██║██║  ██╗██║  ██║██║    ██║  ██║██║",
    " ╚════╝ ╚═╝  ╚═╝ ╚═════╝  ╚═════╝     ╚═╝     ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝    ╚═╝  ╚═╝╚═╝"
  ];

  const line2 = [
    " ██████╗██╗     ██╗",
    "██╔════╝██║     ██║",
    "██║     ██║     ██║",
    "██║     ██║     ██║",
    "╚██████╗███████╗██║",
    " ╚═════╝╚══════╝╚═╝"
  ];

  const colors = [
    { r: 223, g: 193, b: 138 }, // Row 0 (#dfc18a)
    { r: 221, g: 190, b: 134 }, // Row 1
    { r: 218, g: 187, b: 129 }, // Row 2
    { r: 216, g: 184, b: 125 }, // Row 3
    { r: 213, g: 181, b: 120 }, // Row 4
    { r: 211, g: 178, b: 116 }, // Row 5
    { r: 209, g: 175, b: 111 }, // Row 6
    { r: 206, g: 172, b: 107 }, // Row 7
    { r: 204, g: 169, b: 102 }, // Row 8
    { r: 201, g: 166, b: 98 },  // Row 9
    { r: 199, g: 163, b: 93 },  // Row 10
    { r: 197, g: 160, b: 89 }   // Row 11 (#c5a059)
  ];

  function getGoldColor(row: number, text: string): string {
    if (process.env.NO_COLOR || process.env.NODE_DISABLE_COLORS) {
      return text;
    }
    const isColorSupported = !process.env.NO_COLOR && (process.stdout.isTTY || process.env.FORCE_COLOR);
    if (!isColorSupported) {
      return text;
    }
    const supportsTruecolor = process.env.COLORTERM === 'truecolor' || 
                              (process.env.TERM && (process.env.TERM.includes('256') || process.env.TERM.includes('direct')));
    
    if (supportsTruecolor) {
      const color = colors[row];
      return `\x1b[38;2;${color.r};${color.g};${color.b}m${text}\x1b[0m`;
    }
    return pc.yellow(pc.bold(text));
  }

  console.log('\n');
  for (let i = 0; i < 6; i++) {
    console.log(getGoldColor(i, line1[i]));
  }

  console.log('\n');
  for (let i = 0; i < 6; i++) {
    console.log(getGoldColor(i + 6, line2[i]));
  }

  console.log(pc.bold(getGoldColor(0, `\n 🚀 JagoPakaiAI CLI - Smart Rules Synchronizer v${CLI_VERSION}\n`)));
}

async function showMainMenu() {
  printLogo();
  p.intro('JagoPakaiAI CLI Main Menu');
  const choice = await p.select({
    message: 'What would you like to do?',
    options: [
      { value: 'login', label: '🔑 Login (JagoPakaiAI API Key)' },
      { value: 'keys', label: '🔑 Manage AI Provider Keys (Gemini, OpenRouter, Groq)' },
      { value: 'detect', label: '🔍 Detect Workspace & Environment' },
      { value: 'init', label: '🚀 Initialize Project & Generate PRD' },
      { value: 'skills', label: '📚 View Skills Catalog' },
      { value: 'mcp', label: '🛠️ Configure MCP Servers' },
      { value: 'exit', label: '❌ Exit' }
    ]
  });

  if (p.isCancel(choice) || choice === 'exit') {
    p.outro('Goodbye!');
    process.exit(0);
  }

  switch (choice) {
    case 'login':
      await loginCommand();
      break;
    case 'keys':
      await keysCommand();
      break;
    case 'detect':
      await detectCommand();
      break;
    case 'init':
      await initCommand();
      break;
    case 'skills':
      await skillsListCommand();
      break;
    case 'mcp':
      await mcpListCommand();
      break;
  }
}

if (process.argv.length <= 2) {
  showMainMenu();
} else {
  program.parse(process.argv);
}
