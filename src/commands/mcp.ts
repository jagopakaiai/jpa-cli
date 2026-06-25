import * as p from '@clack/prompts';
import os from 'os';
import path from 'path';
import { RECOMMENDED_MCPS, checkMcpInstalled, installMcpServer } from '../utils/mcp.js';

export async function mcpListCommand() {
  p.intro('JagoPakaiAI Recommended MCP Servers');

  const listRows = RECOMMENDED_MCPS.map((m, idx) => {
    const isInstalled = checkMcpInstalled(m.name);
    const statusText = isInstalled ? '● Active' : '○ Not Configured';
    return `${idx + 1}. [${statusText}] ${m.name} (${m.package})\n   Description: ${m.description}`;
  }).join('\n\n');

  p.note(listRows, 'Recommended MCP Servers');

  const shouldInstall = await p.confirm({
    message: 'Would you like to install one of these MCP servers in Claude Code config?',
    initialValue: false
  });

  if (shouldInstall && !p.isCancel(shouldInstall)) {
    const choices = RECOMMENDED_MCPS.map(m => ({ value: m.name, label: `${m.name} (${m.package})` }));
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
  const def = RECOMMENDED_MCPS.find(m => m.name === name);
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
