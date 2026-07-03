import fs from 'fs';
import path from 'path';
import os from 'os';
import * as p from '@clack/prompts';
import pc from 'picocolors';
import {
  getGeminiApiKey, getOpenRouterApiKey, getGroqApiKey,
  readConfig, getConfigPath
} from '../utils/config.js';
import { detectInstalledAgents, detectWorkspace } from '../utils/detector.js';
import { getRecommendedMcps, checkMcpInstalled } from '../utils/mcp.js';
import { getDetectedRuleFiles } from './rules.js';
import { CLI_VERSION } from '../version.js';

export async function statusCommand() {
  p.intro('JPA CLI — System Status');

  const s = p.spinner();
  s.start('Gathering system information...');

  const config = readConfig();
  const agents = detectInstalledAgents();
  const env = detectWorkspace(process.cwd());
  const rules = getDetectedRuleFiles(process.cwd());
  const mcps = getRecommendedMcps();

  s.stop('Done!');

  const keyStatus = [
    `${config.geminiApiKey ? pc.green('● Active') : pc.dim('○ Not set')} Gemini API Key`,
    `${config.openrouterApiKey ? pc.green('● Active') : pc.dim('○ Not set')} OpenRouter API Key`,
    `${config.groqApiKey ? pc.green('● Active') : pc.dim('○ Not set')} Groq API Key`,
  ].join('\n');
  p.note(keyStatus, '🔑 API Keys');

  const agentFields = Object.entries(agents)
    .filter(([_, v]) => v)
    .map(([key]) => {
      const label = key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, s => s.toUpperCase())
        .trim();
      return `  ${pc.green('●')} ${label}`;
    });

  if (agentFields.length > 0) {
    p.note(agentFields.join('\n'), `🤖 AI Agents (${agentFields.length} detected)`);
  } else {
    p.note('No AI agents detected on PATH or VS Code extensions.', '🤖 AI Agents');
  }

  const ruleFields = rules.map(r => {
    const stats = fs.statSync(r.path);
    const hasJago = fs.readFileSync(r.path, 'utf-8').includes('JPA CLI');
    return `  ${hasJago ? pc.green('●') : pc.yellow('○')} ${r.name.padEnd(35)} ${pc.dim(r.label)}`;
  });

  if (ruleFields.length > 0) {
    p.note(ruleFields.join('\n'), `📄 Rule Files (${rules.length} found)`);
  } else {
    p.note('No rule files detected in workspace.', '📄 Rule Files');
  }

  const wsInfo = [
    `  ${env.git ? pc.green('●') : pc.dim('○')} Git repository`,
    `  ${env.vscode ? pc.green('●') : pc.dim('○')} VS Code workspace`,
    `  Project type: ${pc.bold(env.projectType || 'Unknown')}`,
  ].join('\n');
  p.note(wsInfo, '📁 Workspace');

  const installedMcps = mcps.filter(m => checkMcpInstalled(m.name));
  if (installedMcps.length > 0) {
    p.note(
      installedMcps.map(m => `  ${pc.green('●')} ${m.displayName || m.name}`).join('\n'),
      `🛠️ MCP Servers (${installedMcps.length} installed)`
    );
  }

  const skillDirs: string[] = [];
  try {
    const wsSkills = path.join(process.cwd(), '.agents', 'skills');
    const glSkills = path.join(os.homedir(), '.config', 'jpa-cli', 'skills');
    if (fs.existsSync(wsSkills)) {
      for (const dir of fs.readdirSync(wsSkills)) {
        if (fs.existsSync(path.join(wsSkills, dir, 'SKILL.md'))) {
          skillDirs.push(`${dir} (workspace)`);
        }
      }
    }
    if (fs.existsSync(glSkills)) {
      for (const dir of fs.readdirSync(glSkills)) {
        if (fs.existsSync(path.join(glSkills, dir, 'SKILL.md'))) {
          skillDirs.push(`${dir} (global)`);
        }
      }
    }
  } catch {}

  if (skillDirs.length > 0) {
    p.note(
      skillDirs.map(s => `  ${pc.green('●')} ${s}`).join('\n'),
      `🧠 Skills (${skillDirs.length} installed)`
    );
  }

  p.note(
    `Config file: ${pc.cyan(getConfigPath())}\nCLI Version: ${pc.bold(`v${CLI_VERSION}`)}`,
    '⚙️ System'
  );

  p.outro(`Run ${pc.cyan('jpa-cli --help')} to see all commands.`);
}
