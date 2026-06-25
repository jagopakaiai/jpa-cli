import * as p from '@clack/prompts';
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

  const s = p.spinner();
  s.start(`Installing and registering MCP server "${name}"...`);
  try {
    installMcpServer(name);
    s.stop(`Successfully installed and registered MCP "${name}" in Claude Code configuration!`);
    p.log.success(`Registered config in: ~/.claudecode/config.json`);
  } catch (err: any) {
    s.stop('Installation failed!');
    p.log.error(err.message || String(err));
  }
}
