import fs from 'fs';
import path from 'path';
import * as p from '@clack/prompts';
import pc from 'picocolors';
import { detectInstalledAgents, detectWorkspace } from '../utils/detector.js';

interface AgentDefinition {
  name: string;
  label: string;
  description: string;
  files: string[];
  cliCommand?: string;
  vscodeExtension?: string;
  installGuide?: string;
}

const AGENT_DEFINITIONS: AgentDefinition[] = [
  { name: 'cursor', label: 'Cursor', description: 'AI-powered code editor with rules file', files: ['.cursorrules', '.cursor/rules/jpa-cli.md'], cliCommand: 'cursor', vscodeExtension: 'cursor', installGuide: 'Download from https://cursor.com' },
  { name: 'claude-code', label: 'Claude Code', description: 'Anthropic CLI coding agent', files: ['.claudecoderc', 'CLAUDE.md'], cliCommand: 'claude', installGuide: 'npm install -g @anthropic-ai/claude-code' },
  { name: 'claude-md', label: 'Claude MD', description: 'CLAUDE.md project instructions', files: ['CLAUDE.md'], installGuide: 'Create CLAUDE.md in project root' },
  { name: 'copilot', label: 'GitHub Copilot', description: 'GitHub AI pair programmer', files: ['.github/copilot-instructions.md'], vscodeExtension: 'github.copilot', installGuide: 'Install from VS Code marketplace' },
  { name: 'windsurf', label: 'Windsurf', description: 'Codeium AI code editor', files: ['.windsurfrules'], installGuide: 'Create .windsurfrules in project root' },
  { name: 'aider', label: 'Aider', description: 'AI pair programming in terminal', files: ['.aider.instructions.md'], cliCommand: 'aider', installGuide: 'pip install aider-chat' },
  { name: 'trae', label: 'Trae', description: 'AI IDE by ByteDance', files: ['.traerules'], installGuide: 'Download from https://trae.ai' },
  { name: 'trae-cn', label: 'Trae CN', description: 'Trae Chinese version', files: ['.traerules'], installGuide: 'Download from https://trae.cn' },
  { name: 'devin', label: 'Devin', description: 'AI software engineering agent', files: ['.devin/instructions.md'], cliCommand: 'devin', installGuide: 'npm install -g @devin/cli' },
  { name: 'codebuddy', label: 'CodeBuddy', description: 'AI coding assistant', files: ['.codebuddyrc'], cliCommand: 'codebuddy', vscodeExtension: 'codebuddy', installGuide: 'npm install -g codebuddy-cli' },
  { name: 'codex', label: 'Codex CLI', description: 'OpenAI CLI coding agent', files: ['.codexrules'], cliCommand: 'codex', vscodeExtension: 'codex', installGuide: 'npm install -g @openai/codex' },
  { name: 'opencode', label: 'OpenCode', description: 'Open-source AI coding agent', files: ['.opencoderules'], cliCommand: 'opencode', vscodeExtension: 'opencode', installGuide: 'npm install -g opencode' },
  { name: 'kilo', label: 'Kilo', description: 'AI coding assistant CLI', files: ['.kilorules'], cliCommand: 'kilo', installGuide: 'npm install -g kilo' },
  { name: 'kiro', label: 'Kiro', description: 'AI IDE/CLI agent', files: ['.kirorules'], cliCommand: 'kiro', vscodeExtension: 'kiro', installGuide: 'npm install -g kiro-cli' },
  { name: 'openclaw', label: 'OpenClaw', description: 'AI coding agent', files: ['.openclawrules'], cliCommand: 'openclaw', vscodeExtension: 'openclaw', installGuide: 'npm install -g openclaw' },
  { name: 'factory-droid', label: 'Factory Droid', description: 'AI software development agent', files: ['.factorydroidrules'], cliCommand: 'factorydroid', vscodeExtension: 'factorydroid', installGuide: 'npm install -g @factory/droid' },
  { name: 'hermes', label: 'Hermes', description: 'AI coding assistant', files: ['.hermesrules'], cliCommand: 'hermes', vscodeExtension: 'hermes', installGuide: 'npm install -g hermes-cli' },
  { name: 'gemini-cli', label: 'Gemini CLI', description: 'Google Gemini command-line agent', files: ['AGENTS.md', '.agents/AGENTS.md'], cliCommand: 'gemini', vscodeExtension: 'gemini', installGuide: 'npm install -g @google/gemini-cli' },
  { name: 'antigravity', label: 'Google Antigravity', description: 'Google AI agent framework', files: ['AGENTS.md', '.agents/AGENTS.md'], cliCommand: 'antigravity', vscodeExtension: 'antigravity', installGuide: 'npm install -g antigravity' },
  { name: 'pi', label: 'Pi', description: 'Pi coding agent', files: ['AGENTS.md', '.agents/AGENTS.md'], cliCommand: 'pi', vscodeExtension: 'pi', installGuide: 'npm install -g pi-agent' },
  { name: 'cline', label: 'Cline / Roo-Code', description: 'VS Code AI agent extension', files: ['.clinerules'], vscodeExtension: 'claude-dev', installGuide: 'Install from VS Code marketplace' },
];

export function getAgentDefinition(name: string): AgentDefinition | undefined {
  const normalized = name.toLowerCase().replace(/_/g, '-');
  return AGENT_DEFINITIONS.find(a => a.name === normalized || a.label.toLowerCase() === normalized);
}

export function getAllAgentDefinitions(): AgentDefinition[] {
  return AGENT_DEFINITIONS;
}

export function generateAgentRuleContent(agent: AgentDefinition, skillContent?: string): string {
  const lines: string[] = [];
  lines.push(`# AI Rules for ${agent.label} (managed by JPA CLI)`);
  lines.push(`# Agent: ${agent.label}`);
  lines.push(`# Description: ${agent.description}`);
  lines.push('');
  if (agent.cliCommand) {
    lines.push(`## Detection`);
    lines.push(`- CLI command: \`${agent.cliCommand}\``);
    lines.push('- Detected on this system');
    lines.push('');
  }
  lines.push('## Project Context');
  lines.push('- This project uses JPA CLI to manage AI agent configurations.');
  lines.push('- Edit this file manually or use `jpa-cli agent install <name>` to regenerate.');
  lines.push('');
  lines.push('## Rules');
  lines.push('- Write clean, maintainable code following project conventions.');
  lines.push('- Run tests before marking tasks complete.');
  lines.push('- Keep files small and focused on a single responsibility.');
  lines.push('');
  if (skillContent) {
    lines.push(`## Integrated Skill Rules`);
    lines.push(skillContent);
    lines.push('');
  }
  return lines.join('\n');
}

export async function agentListCommand() {
  p.intro('AI Agents Status');
  const installed = detectInstalledAgents();
  const env = detectWorkspace(process.cwd());

  const rows = AGENT_DEFINITIONS.map(a => {
    const isInstalled = !!(installed as any)[a.name.replace(/-/g, '')] ||
      (a.cliCommand && (installed as any)[a.name.replace(/-/g, '')] !== undefined);
    const hasRuleFile = a.files.some(f => fs.existsSync(path.join(process.cwd(), f)));
    const statusIcon = hasRuleFile ? pc.green('●') : isInstalled ? pc.yellow('○') : pc.dim('○');
    const statusText = hasRuleFile ? 'Rules Active' : isInstalled ? 'CLI Detected' : 'Not Found';
    return `${statusIcon} ${pc.bold(a.label.padEnd(16))} ${pc.dim(statusText.padEnd(16))} ${a.description}`;
  }).join('\n');

  p.note(rows, `Agents (${AGENT_DEFINITIONS.length} supported)`);
  p.outro(`Run ${pc.cyan('jpa-cli agent install <name>')} to set up rules for an agent`);
}

export async function agentInstallCommand(name?: string) {
  if (name) {
    const agent = getAgentDefinition(name);
    if (!agent) {
      p.log.error(`Unknown agent "${name}". Use ${pc.cyan('jpa-cli agent list')} to see all supported agents.`);
      return;
    }
    await installSingleAgent(agent);
    return;
  }

  p.intro('Install AI Agent Rules');

  const choices = AGENT_DEFINITIONS.map(a => {
    const hasAny = a.files.some(f => fs.existsSync(path.join(process.cwd(), f)));
    return {
      value: a.name,
      label: `${hasAny ? pc.green('●') : '○'} ${a.label} — ${a.description}`,
      hint: a.files.join(', ')
    };
  });

  const selection = await p.multiselect({
    message: 'Select AI agents to install rules for:',
    options: choices,
    required: true
  });

  if (p.isCancel(selection)) {
    p.cancel('Install cancelled.');
    return;
  }

  const s = p.spinner();
  s.start('Installing agent rule files...');
  let count = 0;
  for (const agentName of selection as string[]) {
    const agent = getAgentDefinition(agentName)!;
    for (const file of agent.files) {
      const fullPath = path.join(process.cwd(), file);
      if (!fs.existsSync(fullPath)) {
        const parentDir = path.dirname(fullPath);
        if (!fs.existsSync(parentDir)) {
          fs.mkdirSync(parentDir, { recursive: true });
        }
        fs.writeFileSync(fullPath, generateAgentRuleContent(agent));
        count++;
      }
    }
  }
  s.stop(`Installed ${count} rule files.`);
  p.outro('Agent rules installation completed!');
}

export async function agentUninstallCommand(name: string) {
  const agent = getAgentDefinition(name);
  if (!agent) {
    p.log.error(`Unknown agent "${name}". Use ${pc.cyan('jpa-cli agent list')} to see supported agents.`);
    return;
  }

  p.intro(`Uninstall ${agent.label} Rules`);

  const filesToRemove: string[] = [];
  for (const file of agent.files) {
    const fullPath = path.join(process.cwd(), file);
    if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        if (content.includes('managed by JPA CLI') || content.includes('JPA CLI')) {
          filesToRemove.push(fullPath);
        }
    }
  }

  if (filesToRemove.length === 0) {
    p.log.warn(`No JPA CLI-managed rule files found for ${agent.label}.`);
    p.outro('Nothing to uninstall.');
    return;
  }

  p.log.info(`Found ${filesToRemove.length} JPA CLI-managed file(s):`);
  filesToRemove.forEach(f => p.log.info(`  ${f}`));

  const confirm = await p.confirm({
    message: 'Remove these files?',
    initialValue: false
  });

  if (p.isCancel(confirm) || !confirm) {
    p.cancel('Uninstall cancelled.');
    return;
  }

  const s = p.spinner();
  s.start('Removing files...');
  for (const file of filesToRemove) {
    fs.unlinkSync(file);
    p.log.success(`Removed: ${file}`);
  }
  s.stop('Uninstall complete!');
  p.outro(`Successfully uninstalled ${agent.label} rules.`);
}

export async function agentConfigCommand(name: string) {
  const agent = getAgentDefinition(name);
  if (!agent) {
    p.log.error(`Unknown agent "${name}". Use ${pc.cyan('jpa-cli agent list')} to see supported agents.`);
    return;
  }

  p.intro(`${agent.label} Configuration`);

  const content = generateAgentRuleContent(agent);
  const detected = detectInstalledAgents();

  const infoLines = [
    `Name: ${pc.bold(agent.label)}`,
    `Description: ${agent.description}`,
    `Config files: ${agent.files.join(', ')}`,
    agent.cliCommand ? `CLI command: ${agent.cliCommand}` : null,
    agent.vscodeExtension ? `VS Code extension: ${agent.vscodeExtension}` : null,
    agent.installGuide ? `Install: ${agent.installGuide}` : null,
    '',
    'Status:',
    ...agent.files.map(f => {
      const exists = fs.existsSync(path.join(process.cwd(), f));
      return `  ${exists ? pc.green('✓') : pc.red('✗')} ${f}`;
    }),
    '',
    'Recommended template content:'
  ].filter(Boolean).join('\n');

  p.note(infoLines, `${agent.label} Info`);
  p.note(content, 'Rule Template');

  const action = await p.select({
    message: 'What would you like to do?',
    options: [
      { value: 'install', label: '📥 Install rules for this agent' },
      { value: 'cancel', label: '🔙 Back' }
    ]
  });

  if (action === 'install') {
    await installSingleAgent(agent);
  }
  p.outro('Done.');
}

async function installSingleAgent(agent: AgentDefinition) {
  const s = p.spinner();
  s.start(`Installing rules for ${agent.label}...`);
  let installed = 0;
  for (const file of agent.files) {
    const fullPath = path.join(process.cwd(), file);
    if (!fs.existsSync(fullPath)) {
      const parentDir = path.dirname(fullPath);
      if (!fs.existsSync(parentDir)) {
        fs.mkdirSync(parentDir, { recursive: true });
      }
      fs.writeFileSync(fullPath, generateAgentRuleContent(agent));
      installed++;
    } else {
      const content = fs.readFileSync(fullPath, 'utf-8');
      if (!content.includes('managed by JPA CLI')) {
        const appendContent = '\n\n' + generateAgentRuleContent(agent);
        fs.writeFileSync(fullPath, content + appendContent);
        installed++;
      }
    }
  }
  s.stop(`Installed ${installed} file(s) for ${agent.label}!`);
  p.log.success(`Files: ${agent.files.join(', ')}`);
  p.outro(`${agent.label} rules installed successfully.`);
}
