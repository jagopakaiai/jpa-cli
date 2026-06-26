import fs from 'fs';
import path from 'path';
import os from 'os';
import { execSync } from 'child_process';

const CLAUDE_CONFIG_DIR = path.join(os.homedir(), '.claudecode');
const CLAUDE_CONFIG_FILE = path.join(CLAUDE_CONFIG_DIR, 'config.json');

export interface McpServerConfig {
  command: string;
  args: string[];
  env?: Record<string, string>;
}

export interface ClaudeConfig {
  mcpServers?: Record<string, McpServerConfig>;
}

export interface McpDefinition {
  name: string;
  displayName?: string;
  description: string;
  package?: string; // fallback
  defaultArgs?: string[]; // fallback
  mcpConfig?: McpServerConfig;
}

// Load MCP Definitions dynamically from the mcp folder
export function loadMcpDefinitions(): McpDefinition[] {
  let mcpDir = path.join(__dirname, '..', '..', 'mcp');
  if (!fs.existsSync(mcpDir)) {
    mcpDir = path.join(__dirname, '..', 'mcp');
  }
  const definitions: McpDefinition[] = [];
  
  if (!fs.existsSync(mcpDir)) {
    return [];
  }

  const items = fs.readdirSync(mcpDir);
  for (const item of items) {
    const itemPath = path.join(mcpDir, item);
    if (fs.statSync(itemPath).isDirectory()) {
      const configPath = path.join(itemPath, 'config.json');
      if (fs.existsSync(configPath)) {
        try {
          const data = fs.readFileSync(configPath, 'utf-8');
          const parsed = JSON.parse(data);
          definitions.push({
            name: parsed.name || item,
            displayName: parsed.displayName,
            description: parsed.description || '',
            mcpConfig: parsed.mcpConfig
          });
        } catch (e) {
          // Ignore corrupted configs
        }
      }
    }
  }
  return definitions;
}

export const RECOMMENDED_MCPS: McpDefinition[] = loadMcpDefinitions();

export function getClaudeConfig(): ClaudeConfig {
  if (!fs.existsSync(CLAUDE_CONFIG_FILE)) {
    return {};
  }
  try {
    const data = fs.readFileSync(CLAUDE_CONFIG_FILE, 'utf-8');
    return JSON.parse(data) as ClaudeConfig;
  } catch {
    return {};
  }
}

export function saveClaudeConfig(config: ClaudeConfig): void {
  if (!fs.existsSync(CLAUDE_CONFIG_DIR)) {
    fs.mkdirSync(CLAUDE_CONFIG_DIR, { recursive: true });
  }
  fs.writeFileSync(CLAUDE_CONFIG_FILE, JSON.stringify(config, null, 2));
}

export function checkMcpInstalled(name: string): boolean {
  const config = getClaudeConfig();
  if (config.mcpServers && config.mcpServers[name]) {
    return true;
  }
  return false;
}

export function installMcpServer(name: string, customArgs?: string[], customEnv?: Record<string, string>): void {
  const defs = loadMcpDefinitions();
  const def = defs.find(m => m.name === name);
  if (!def || !def.mcpConfig) {
    throw new Error(`MCP Server "${name}" is not supported or missing config.`);
  }

  const cmdConfig = def.mcpConfig;
  
  // Attempt global install if NPX/npm package is defined in args
  if (cmdConfig.command === 'npx' && cmdConfig.args.length > 1) {
    const pkg = cmdConfig.args[1];
    try {
      console.log(`Installing ${pkg} globally via npm...`);
      execSync(`npm install -g ${pkg}`, { stdio: 'ignore' });
    } catch {
      console.log('Global npm install failed, will fallback to npx execution.');
    }
  }

  const config = getClaudeConfig();
  if (!config.mcpServers) {
    config.mcpServers = {};
  }

  config.mcpServers[name] = {
    command: cmdConfig.command,
    args: customArgs || cmdConfig.args,
    ...(customEnv && Object.keys(customEnv).length > 0 ? { env: customEnv } : (cmdConfig.env ? { env: cmdConfig.env } : {}))
  };

  saveClaudeConfig(config);
}

