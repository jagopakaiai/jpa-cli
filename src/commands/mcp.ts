import fs from 'fs';
import * as p from '@clack/prompts';
import pc from 'picocolors';
import os from 'os';
import path from 'path';
import { getRecommendedMcps, checkMcpInstalled, installMcpServer, getClaudeConfig, saveClaudeConfig } from '../utils/mcp.js';

export async function mcpListCommand() {
  p.intro('JPA CLI Recommended MCP Servers');

  const defs = getRecommendedMcps();
  const listRows = defs.map((m, idx) => {
    const isInstalled = checkMcpInstalled(m.name);
    const statusText = isInstalled ? '● Active' : '○ Not Configured';
    return `${idx + 1}. [${statusText}] ${m.displayName || m.name}\n   Description: ${m.description}`;
  }).join('\n\n');

  p.note(listRows, 'Recommended MCP Servers');

  const shouldInstall = await p.confirm({
    message: 'Would you like to install one of these MCP servers in Claude Code config?',
    initialValue: false
  });

  if (shouldInstall && !p.isCancel(shouldInstall)) {
    const choices = defs.map(m => ({ value: m.name, label: m.displayName || m.name }));
    const selectMcp = await p.select({
      message: 'Select an MCP server to install:',
      options: choices
    });

    if (!p.isCancel(selectMcp)) {
      await mcpInstallCommand(selectMcp as string);
    }
  }

  p.outro('MCP configuration check complete!');
}

export async function mcpInstallCommand(name: string) {
  const defs = getRecommendedMcps();
  const def = defs.find(m => m.name === name);
  if (!def) {
    p.log.error(`MCP Server "${name}" is not supported.`);
    return;
  }

  let customArgs: string[] = [];
  let customEnv: Record<string, string> = {};

  if (name === 'sqlite') {
    const dbPath = await p.text({
      message: 'Enter the SQLite database file path (relative or absolute):',
      placeholder: 'sqlite.db',
      initialValue: 'sqlite.db'
    });
    if (p.isCancel(dbPath)) return;
    customArgs = ['--db', dbPath as string];
  } else if (name === 'postgres') {
    const connStr = await p.text({
      message: 'Enter the PostgreSQL connection URL (optional):',
      placeholder: 'postgresql://localhost:5432/mydb'
    });
    if (p.isCancel(connStr)) return;
    if (connStr) {
      customArgs = [connStr as string];
    }
  } else if (name === 'filesystem') {
    const defaultPath = path.join(os.homedir(), 'Projects');
    const folderPath = await p.text({
      message: 'Enter the allowed folder path:',
      placeholder: defaultPath,
      initialValue: process.cwd()
    });
    if (p.isCancel(folderPath)) return;
    customArgs = [folderPath as string];
  } else if (name === 'github') {
    const token = await p.password({
      message: 'Enter your GitHub Personal Access Token (optional, sets GITHUB_PERSONAL_ACCESS_TOKEN):'
    });
    if (p.isCancel(token)) return;
    if (token) {
      customEnv['GITHUB_PERSONAL_ACCESS_TOKEN'] = token as string;
    }
  } else if (name === 'brave-search') {
    const key = await p.password({
      message: 'Enter your Brave Search API Key (optional, sets BRAVE_API_KEY):'
    });
    if (p.isCancel(key)) return;
    if (key) {
      customEnv['BRAVE_API_KEY'] = key as string;
    }
  }

  const s = p.spinner();
  s.start(`Installing and registering MCP server "${name}"...`);
  try {
    installMcpServer(name, customArgs, customEnv);
    s.stop(`Successfully installed and registered MCP "${name}" in Claude Code configuration!`);
    p.log.success(`Registered config in: ~/.claudecode/config.json`);
  } catch (err: any) {
    s.stop('Installation failed!');
    p.log.error(err.message || String(err));
  }
}

export async function mcpUninstallCommand(name: string) {
  const config = getClaudeConfig();
  if (!config.mcpServers || !config.mcpServers[name]) {
    p.log.warn(`MCP Server "${name}" is not installed.`);
    return;
  }

  const confirm = await p.confirm({
    message: `Remove MCP server "${name}" from Claude Code config?`,
    initialValue: false
  });

  if (p.isCancel(confirm) || !confirm) {
    p.cancel('Uninstall cancelled.');
    return;
  }

  const s = p.spinner();
  s.start(`Removing MCP server "${name}"...`);
  delete config.mcpServers[name];
  saveClaudeConfig(config);
  s.stop('Removed successfully!');
  p.log.success(`MCP server "${name}" has been uninstalled.`);
}

export async function mcpStatusCommand() {
  p.intro('MCP Server Status');
  const config = getClaudeConfig();
  const allMcps = getRecommendedMcps();

  const installed = allMcps.filter(m => checkMcpInstalled(m.name));

  if (installed.length === 0) {
    p.log.warn('No MCP servers are currently installed.');
    p.outro(`Run ${pc.cyan('jpa-cli mcp list')} to see available servers.`);
    return;
  }

  const rows = installed.map(m => {
    const cfg = config.mcpServers?.[m.name];
    const argsStr = cfg?.args?.join(' ') || '';
    return `  ${pc.green('●')} ${pc.bold(m.displayName || m.name)}
     ${pc.dim('Command:')} ${cfg?.command || '?'} ${argsStr}`;
  }).join('\n\n');

  p.note(rows, `Installed MCP Servers (${installed.length})`);
  p.outro(`Use ${pc.cyan('jpa-cli mcp uninstall <name>')} to remove.`);
}
