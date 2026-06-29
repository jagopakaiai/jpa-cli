import { Command } from 'commander';
import { loginCommand } from './commands/login.js';
import { detectCommand } from './commands/detect.js';
import { syncCommand } from './commands/sync.js';
import { initCommand } from './commands/init.js';
import { skillsListCommand, skillsCreateCommand, skillsValidateCommand } from './commands/skills.js';
import { mcpListCommand, mcpInstallCommand, mcpUninstallCommand, mcpStatusCommand } from './commands/mcp.js';
import { keysCommand } from './commands/keys.js';
import { agentListCommand, agentInstallCommand, agentUninstallCommand, agentConfigCommand } from './commands/agent.js';
import { rulesListCommand, rulesViewCommand, rulesBackupCommand, rulesRestoreCommand, rulesCleanCommand, rulesTemplateCommand } from './commands/rules.js';
import { statusCommand } from './commands/status.js';
import { backupAllCommand, backupListCommand } from './commands/backup.js';
import { updateCommand } from './commands/update.js';
import { CLI_VERSION } from './version.js';
import * as p from '@clack/prompts';
import pc from 'picocolors';
import fs from 'fs';
import path from 'path';

const program = new Command();

program
  .name('jagopakaiai-cli')
  .description('JagoPakaiAI CLI — AI agent rules synchronizer & workspace manager')
  .version(CLI_VERSION, '-v, --version', 'Display CLI version')
  .helpOption('-h, --help', 'Display help for command')
  .helpCommand(false);

// ─── Agent Command Group ──────────────────────────────────────
const agentCmd = new Command('agent')
  .description('Manage AI agent rule files in workspace')
  .summary('Install, uninstall, list, or inspect AI agent configs')
  .helpOption('-h, --help', 'Display help for agent command');

agentCmd
  .command('list')
  .description('List all supported AI agents and their status')
  .action(agentListCommand);

agentCmd
  .command('install')
  .description('Install rule files for AI agents')
  .argument('[name]', 'Agent name (e.g. cursor, claude-code). Omit for interactive selection.')
  .option('-a, --all', 'Install rules for all detected agents')
  .action(async (name, options) => {
    if (options.all) {
      const { getAllAgentDefinitions, generateAgentRuleContent } = await import('./commands/agent.js');
      const all = getAllAgentDefinitions();
      let count = 0;
      for (const agent of all) {
        for (const file of agent.files) {
          const fullPath = path.join(process.cwd(), file);
          if (!fs.existsSync(fullPath)) {
            const parentDir = path.dirname(fullPath);
            if (!fs.existsSync(parentDir)) { fs.mkdirSync(parentDir, { recursive: true }); }
            fs.writeFileSync(fullPath, generateAgentRuleContent(agent));
            count++;
          }
        }
      }
      p.log.success(`Installed ${count} rule files for ${all.length} agents.`);
      return;
    }
    await agentInstallCommand(name);
  });

agentCmd
  .command('uninstall')
  .description('Remove JagoPakaiAI-managed rule files')
  .argument('<name>', 'Agent name to uninstall (e.g. cursor, claude-code)')
  .action(agentUninstallCommand);

agentCmd
  .command('config')
  .description('Show configuration info and rule template for an agent')
  .argument('<name>', 'Agent name (e.g. cursor, claude-code)')
  .action(agentConfigCommand);

program.addCommand(agentCmd);

// ─── Rules Command Group ──────────────────────────────────────
const rulesCmd = new Command('rules')
  .description('Manage AI rule files in workspace')
  .summary('List, view, backup, restore, clean, or generate rule templates')
  .helpOption('-h, --help', 'Display help for rules command');

rulesCmd
  .command('list')
  .description('List all detected AI rule files in workspace')
  .action(rulesListCommand);

rulesCmd
  .command('view')
  .description('Display content of a rule file')
  .argument('<name>', 'Rule file name or path (e.g. .cursorrules)')
  .action(rulesViewCommand);

rulesCmd
  .command('backup')
  .description('Create a timestamped backup of all workspace rule files')
  .action(rulesBackupCommand);

rulesCmd
  .command('restore')
  .description('Restore rule files from a previous backup')
  .action(rulesRestoreCommand);

rulesCmd
  .command('clean')
  .description('Remove JagoPakaiAI-managed sections from rule files')
  .action(rulesCleanCommand);

rulesCmd
  .command('template')
  .description('Generate a rule file template for an AI agent')
  .argument('[type]', 'Template type (cursor, claude, copilot, etc.)')
  .action(rulesTemplateCommand);

program.addCommand(rulesCmd);

// ─── MCP Command Group ────────────────────────────────────────
const mcpCmd = new Command('mcp')
  .description('Manage Model Context Protocol (MCP) servers')
  .summary('List, install, uninstall, or check MCP server status')
  .helpOption('-h, --help', 'Display help for mcp command');

mcpCmd
  .command('list')
  .description('List recommended MCP servers and their installation status')
  .action(mcpListCommand);

mcpCmd
  .command('install')
  .description('Install and register an MCP server in Claude Code config')
  .argument('<name>', 'MCP server name (e.g. sqlite, postgres, github)')
  .action(mcpInstallCommand);

mcpCmd
  .command('uninstall')
  .description('Uninstall and remove an MCP server from Claude Code config')
  .argument('<name>', 'MCP server name to remove')
  .action(mcpUninstallCommand);

mcpCmd
  .command('status')
  .description('Show installed MCP servers and their configuration')
  .action(mcpStatusCommand);

program.addCommand(mcpCmd);

// ─── Skills Command Group ─────────────────────────────────────
const skillsCmd = new Command('skills')
  .description('Manage agent skill definitions')
  .summary('Browse, search, install, create, or validate skills')
  .helpOption('-h, --help', 'Display help for skills command');

skillsCmd
  .command('list')
  .description('Browse and manage available skills')
  .action(skillsListCommand);

skillsCmd
  .command('search')
  .description('Search for skills by keyword')
  .argument('<query>', 'Search keyword')
  .action(async (query) => {
    const { skillsSearchCommand } = await import('./commands/skills.js');
    await skillsSearchCommand(query);
  });

skillsCmd
  .command('create')
  .description('Scaffold a new custom skill template')
  .action(skillsCreateCommand);

skillsCmd
  .command('validate')
  .description('Validate a local SKILL.md file structure')
  .argument('[path]', 'Path to SKILL.md file')
  .action(skillsValidateCommand);

program.addCommand(skillsCmd);

// ─── Backup Command Group ─────────────────────────────────────
const backupCmd = new Command('backup')
  .description('Create and manage full configuration backups')
  .summary('Backup or list all JagoPakaiAI configurations')
  .helpOption('-h, --help', 'Display help for backup command');

backupCmd
  .command('create')
  .description('Create a full backup of all configurations (keys, rules, skills, MCP)')
  .action(backupAllCommand);

backupCmd
  .command('list')
  .description('List all available backups')
  .action(backupListCommand);

program.addCommand(backupCmd);

// ─── Top-level Commands ───────────────────────────────────────

program
  .command('login')
  .description('Authenticate with your JagoPakaiAI API Key')
  .action(loginCommand);

program
  .command('logout')
  .description('Clear saved JagoPakaiAI API Key')
  .action(async () => {
    const { deleteApiKey, readConfig, writeConfig } = await import('./utils/config.js');
    const config = readConfig();
    delete config.apiKey;
    writeConfig(config);
    p.log.success('Logged out. API key removed.');
  });

program
  .command('keys')
  .description('Manage API keys for AI providers (Gemini, OpenRouter, Groq, JagoPakaiAI)')
  .argument('[provider]', 'Provider name: gemini, openrouter, groq, jagopakaiai')
  .argument('[key]', 'API key value (omit for interactive prompt)')
  .action(keysCommand);

program
  .command('detect')
  .description('Scan workspace environment and detect AI agent configurations')
  .option('-v, --verbose', 'Show detailed detection output')
  .action(detectCommand);

program
  .command('status')
  .description('Show comprehensive system status overview')
  .action(statusCommand);

program
  .command('init')
  .description('Initialize project with AI agent rules, detect agents, and generate PRD')
  .action(initCommand);

program
  .command('sync')
  .description('Sync a skill profile into your workspace AI rule files')
  .argument('[skill-name]', 'Skill name/slug to synchronize')
  .option('-u, --url <url>', 'Fetch skill from raw URL instead of API')
  .option('-l, --list', 'List available skills without syncing')
  .action(async (skillName, options) => {
    if (options.list) {
      const { skillsListCommand } = await import('./commands/skills.js');
      await skillsListCommand();
      return;
    }
    await syncCommand(skillName, options.url);
  });

program
  .command('update')
  .description('Check for CLI updates and optionally install the latest version')
  .option('--install', 'Automatically install the update without prompting')
  .action(async (options) => {
    await updateCommand(options.install);
  });

program
  .command('help')
  .description('Display detailed help with examples')
  .argument('[command]', 'Command name to show help for')
  .action((cmd) => {
    if (cmd) {
      const c = program.commands.find((c: any) => c.name() === cmd);
      if (c) {
        c.outputHelp();
      } else {
        program.outputHelp();
      }
    } else {
      printDetailedHelp();
    }
  });

// ─── Printer ──────────────────────────────────────────────────
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
    { r: 223, g: 193, b: 138 },
    { r: 221, g: 190, b: 134 },
    { r: 218, g: 187, b: 129 },
    { r: 216, g: 184, b: 125 },
    { r: 213, g: 181, b: 120 },
    { r: 211, g: 178, b: 116 },
    { r: 209, g: 175, b: 111 },
    { r: 206, g: 172, b: 107 },
    { r: 204, g: 169, b: 102 },
    { r: 201, g: 166, b: 98 },
    { r: 199, g: 163, b: 93 },
    { r: 197, g: 160, b: 89 }
  ];

  function getGoldColor(row: number, text: string): string {
    if (process.env.NO_COLOR || process.env.NODE_DISABLE_COLORS) return text;
    const isColorSupported = !process.env.NO_COLOR && (process.stdout.isTTY || process.env.FORCE_COLOR);
    if (!isColorSupported) return text;
    const supportsTruecolor = process.env.COLORTERM === 'truecolor' ||
      (process.env.TERM && (process.env.TERM.includes('256') || process.env.TERM.includes('direct')));
    if (supportsTruecolor) {
      const color = colors[row];
      return `\x1b[38;2;${color.r};${color.g};${color.b}m${text}\x1b[0m`;
    }
    return pc.yellow(pc.bold(text));
  }

  console.log('\n');
  for (let i = 0; i < 6; i++) console.log(getGoldColor(i, line1[i]));
  console.log('\n');
  for (let i = 0; i < 6; i++) console.log(getGoldColor(i + 6, line2[i]));
  console.log(pc.bold(getGoldColor(0, `\n 🚀 JagoPakaiAI CLI - Smart Rules Synchronizer v${CLI_VERSION}\n`)));
}

function printDetailedHelp() {
  printLogo();
  const help = [
    `${pc.bold('USAGE')}`,
    `  jagopakaiai-cli <command> [options]`,
    ``,
    `${pc.bold('COMMANDS')}`,
    ``,
    `${pc.cyan('  login')}              Authenticate with JagoPakaiAI API Key`,
    `${pc.cyan('  logout')}             Clear saved JagoPakaiAI API Key`,
    `${pc.cyan('  keys')}               Manage API keys for Gemini, OpenRouter, Groq, JagoPakaiAI`,
    `                       ${pc.dim('jagopakaiai-cli keys <provider> [key]')}`,
    ``,
    `${pc.cyan('  status')}             Show comprehensive system status overview`,
    `${pc.cyan('  detect')}             Scan workspace for AI agent configurations`,
    `${pc.cyan('  init')}               Initialize project with AI rules and generate PRD`,
    ``,
    `${pc.cyan('  agent')}              Manage AI agent rule files`,
    `                       ${pc.dim('agent list                     — List all agents')}`,
    `                       ${pc.dim('agent install [name]           — Install rules for an agent')}`,
    `                       ${pc.dim('agent install --all            — Install rules for ALL agents')}`,
    `                       ${pc.dim('agent uninstall <name>         — Remove rules for an agent')}`,
    `                       ${pc.dim('agent config <name>            — Show agent config info')}`,
    ``,
    `${pc.cyan('  rules')}              Manage AI rule files in workspace`,
    `                       ${pc.dim('rules list                    — List all rule files')}`,
    `                       ${pc.dim('rules view <name>             — View rule file contents')}`,
    `                       ${pc.dim('rules backup                  — Backup all rule files')}`,
    `                       ${pc.dim('rules restore                 — Restore from backup')}`,
    `                       ${pc.dim('rules clean                   — Remove JagoPakaiAI sections')}`,
    `                       ${pc.dim('rules template [type]         — Generate template')}`,
    ``,
    `${pc.cyan('  sync')}               Sync a skill into workspace AI rule files`,
    `                       ${pc.dim('jagopakaiai-cli sync <skill-name>')}`,
    `                       ${pc.dim('jagopakaiai-cli sync --list')}`,
    ``,
    `${pc.cyan('  mcp')}                Manage MCP (Model Context Protocol) servers`,
    `                       ${pc.dim('mcp list                      — List available MCPs')}`,
    `                       ${pc.dim('mcp install <name>            — Install MCP server')}`,
    `                       ${pc.dim('mcp uninstall <name>          — Uninstall MCP server')}`,
    `                       ${pc.dim('mcp status                    — Show installed MCPs')}`,
    ``,
    `${pc.cyan('  skills')}             Manage agent skill definitions`,
    `                       ${pc.dim('skills list                  — Browse & manage skills')}`,
    `                       ${pc.dim('skills search <query>        — Search skills')}`,
    `                       ${pc.dim('skills create                — Create new skill')}`,
    `                       ${pc.dim('skills validate [path]       — Validate SKILL.md')}`,
    ``,
    `${pc.cyan('  backup')}             Create and manage full configuration backups`,
    `                       ${pc.dim('backup create                — Backup all configs')}`,
    `                       ${pc.dim('backup list                  — List backups')}`,
    ``,
    `${pc.cyan('  update')}             Check for and install CLI updates`,
    `${pc.cyan('  help')}               Display this detailed help message`,
    ``,
    `${pc.bold('OPTIONS')}`,
    `  -v, --version          Display CLI version`,
    `  -h, --help             Display help for any command`,
    ``,
    `${pc.bold('EXAMPLES')}`,
    `  jagopakaiai-cli login                          # Authenticate with API key`,
    `  jagopakaiai-cli keys gemini                    # Set Gemini API key`,
    `  jagopakaiai-cli detect                         # Scan current workspace`,
    `  jagopakaiai-cli status                         # Show full system status`,
    `  jagopakaiai-cli agent install cursor           # Install .cursorrules`,
    `  jagopakaiai-cli agent uninstall claude-code    # Remove Claude Code rules`,
    `  jagopakaiai-cli rules backup                   # Backup all rule files`,
    `  jagopakaiai-cli sync laravel-clean-api         # Sync skill from API`,
    `  jagopakaiai-cli mcp install sqlite             # Install SQLite MCP`,
    `  jagopakaiai-cli init                           # Initialize new project`,
    `  jagopakaiai-cli update                         # Check for updates`,
    ``,
    `${pc.dim('Full documentation: https://jagopakaiai.my.id')}`
  ].join('\n');

  console.log(pc.cyan(help));
}

// ─── Main Menu ────────────────────────────────────────────────
async function showMainMenu() {
  printLogo();
  const choice = await p.select({
    message: 'What would you like to do?',
    options: [
      { value: 'status', label: '📊 System Status Overview' },
      { value: 'login', label: '🔑 Login (JagoPakaiAI API Key)' },
      { value: 'keys', label: '🔑 Manage AI Provider Keys' },
      { value: 'detect', label: '🔍 Detect Workspace & Environment' },
      { value: 'init', label: '🚀 Initialize Project & Generate PRD' },
      { value: 'sync', label: '🔄 Sync Skill to Workspace' },
      { value: 'agent', label: '🤖 Manage AI Agent Rules' },
      { value: 'rules', label: '📄 Manage Rule Files' },
      { value: 'skills', label: '📚 Manage Skills Catalog' },
      { value: 'mcp', label: '🛠️ Manage MCP Servers' },
      { value: 'backup', label: '💾 Backup Configurations' },
      { value: 'update', label: '⬆️ Check for Updates' },
      { value: 'exit', label: '❌ Exit' }
    ]
  });

  if (p.isCancel(choice) || choice === 'exit') {
    p.outro('Goodbye!');
    process.exit(0);
  }

  switch (choice) {
    case 'status':
      await statusCommand();
      break;
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
    case 'sync': {
      const skillName = await p.text({ message: 'Enter skill name to sync:', validate: v => v ? undefined : 'Required' });
      if (!p.isCancel(skillName)) await syncCommand(skillName as string);
      break;
    }
    case 'agent':
      await agentListCommand();
      break;
    case 'rules':
      await rulesListCommand();
      break;
    case 'skills':
      await skillsListCommand();
      break;
    case 'mcp':
      await mcpListCommand();
      break;
    case 'backup':
      await backupAllCommand();
      break;
    case 'update': {
      const { updateCommand } = await import('./commands/update.js');
      await updateCommand();
      break;
    }
  }
}

if (process.argv.length <= 2) {
  showMainMenu();
} else {
  program.parse(process.argv);
}
