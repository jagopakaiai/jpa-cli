import fs from 'fs';
import path from 'path';

export interface DetectedEnv {
  cursor: boolean;
  claude: boolean;
  copilot: boolean;
  git: boolean;
  vscode: boolean;
  projectType: string | null;
  claudeMd: boolean;
  cursorDir: boolean;
  windsurf: boolean;
  agentsMd: boolean;
  aiderRules: boolean;
  traerules: boolean;
  devinDir: boolean;
  codebuddyrc: boolean;
  codexrules: boolean;
  opencoderules: boolean;
  kilorules: boolean;
  kirorules: boolean;
  openclawrules: boolean;
  factorydroidrules: boolean;
  hermesrules: boolean;
}

export function detectWorkspace(dir: string): DetectedEnv {
  const env: DetectedEnv = {
    cursor: false,
    claude: false,
    copilot: false,
    git: false,
    vscode: false,
    projectType: null,
    claudeMd: false,
    cursorDir: false,
    windsurf: false,
    agentsMd: false,
    aiderRules: false,
    traerules: false,
    devinDir: false,
    codebuddyrc: false,
    codexrules: false,
    opencoderules: false,
    kilorules: false,
    kirorules: false,
    openclawrules: false,
    factorydroidrules: false,
    hermesrules: false
  };

  if (fs.existsSync(path.join(dir, '.cursorrules'))) {
    env.cursor = true;
  }
  if (fs.existsSync(path.join(dir, '.claudecoderc')) || fs.existsSync(path.join(dir, '.claudecode'))) {
    env.claude = true;
  }
  if (fs.existsSync(path.join(dir, '.github', 'copilot-instructions.md'))) {
    env.copilot = true;
  }
  if (fs.existsSync(path.join(dir, '.git'))) {
    env.git = true;
  }
  if (fs.existsSync(path.join(dir, '.vscode'))) {
    env.vscode = true;
  }
  if (fs.existsSync(path.join(dir, 'CLAUDE.md'))) {
    env.claudeMd = true;
  }
  if (fs.existsSync(path.join(dir, '.cursor', 'rules'))) {
    env.cursorDir = true;
  }
  if (fs.existsSync(path.join(dir, '.windsurfrules'))) {
    env.windsurf = true;
  }
  if (fs.existsSync(path.join(dir, 'AGENTS.md')) || fs.existsSync(path.join(dir, '.agents', 'AGENTS.md'))) {
    env.agentsMd = true;
  }
  if (fs.existsSync(path.join(dir, '.aider.instructions.md'))) {
    env.aiderRules = true;
  }
  if (fs.existsSync(path.join(dir, '.traerules'))) {
    env.traerules = true;
  }
  if (fs.existsSync(path.join(dir, '.devin', 'instructions.md')) || fs.existsSync(path.join(dir, '.devin-instructions'))) {
    env.devinDir = true;
  }
  if (fs.existsSync(path.join(dir, '.codebuddyrc'))) {
    env.codebuddyrc = true;
  }
  if (fs.existsSync(path.join(dir, '.codexrules'))) {
    env.codexrules = true;
  }
  if (fs.existsSync(path.join(dir, '.opencoderules'))) {
    env.opencoderules = true;
  }
  if (fs.existsSync(path.join(dir, '.kilorules'))) {
    env.kilorules = true;
  }
  if (fs.existsSync(path.join(dir, '.kirorules'))) {
    env.kirorules = true;
  }
  if (fs.existsSync(path.join(dir, '.openclawrules'))) {
    env.openclawrules = true;
  }
  if (fs.existsSync(path.join(dir, '.factorydroidrules'))) {
    env.factorydroidrules = true;
  }
  if (fs.existsSync(path.join(dir, '.hermesrules'))) {
    env.hermesrules = true;
  }

  // Attempt to guess project type/framework — extended support
  if (fs.existsSync(path.join(dir, 'package.json'))) {
    env.projectType = 'NodeJS/JavaScript';
  } else if (fs.existsSync(path.join(dir, 'composer.json'))) {
    env.projectType = 'PHP/Laravel';
  } else if (fs.existsSync(path.join(dir, 'requirements.txt')) || fs.existsSync(path.join(dir, 'pyproject.toml'))) {
    env.projectType = 'Python';
  } else if (fs.existsSync(path.join(dir, 'Cargo.toml'))) {
    env.projectType = 'Rust';
  } else if (fs.existsSync(path.join(dir, 'go.mod'))) {
    env.projectType = 'Go';
  } else if (fs.existsSync(path.join(dir, 'Gemfile'))) {
    env.projectType = 'Ruby';
  } else if (fs.existsSync(path.join(dir, 'pubspec.yaml'))) {
    env.projectType = 'Flutter/Dart';
  } else if (
    fs.readdirSync(dir).some(f => f.endsWith('.csproj') || f.endsWith('.sln')) ||
    fs.existsSync(path.join(dir, 'global.json'))
  ) {
    env.projectType = '.NET/C#';
  } else if (fs.existsSync(path.join(dir, 'Package.swift')) || fs.readdirSync(dir).some(f => f.endsWith('.xcodeproj'))) {
    env.projectType = 'Swift/iOS';
  } else if (fs.existsSync(path.join(dir, 'deno.json')) || fs.existsSync(path.join(dir, 'deno.jsonc'))) {
    env.projectType = 'Deno';
  }

  return env;
}

import { execSync } from 'child_process';
import os from 'os';

export interface InstalledAgents {
  geminiCli: boolean;
  cursor: boolean;
  claudeCode: boolean;
  codeBuddy: boolean;
  codex: boolean;
  openCode: boolean;
  kilo: boolean;
  aider: boolean;
  copilotCli: boolean;
  copilotChat: boolean;
  openClaw: boolean;
  factoryDroid: boolean;
  trae: boolean;
  traeCn: boolean;
  antigravity: boolean;
  hermes: boolean;
  kiro: boolean;
  pi: boolean;
  devin: boolean;
  cline: boolean;
}

export function detectInstalledAgents(): InstalledAgents {
  const agents: InstalledAgents = {
    geminiCli: false,
    cursor: false,
    claudeCode: false,
    codeBuddy: false,
    codex: false,
    openCode: false,
    kilo: false,
    aider: false,
    copilotCli: false,
    copilotChat: false,
    openClaw: false,
    factoryDroid: false,
    trae: false,
    traeCn: false,
    antigravity: false,
    hermes: false,
    kiro: false,
    pi: false,
    devin: false,
    cline: false
  };

  const checkCommand = (cmd: string): boolean => {
    try {
      const checkCmd = process.platform === 'win32' ? `where.exe ${cmd}` : `command -v ${cmd}`;
      execSync(checkCmd, { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  };

  const checkVscodeExtension = (pattern: string): boolean => {
    const home = os.homedir();
    const extDir = path.join(home, '.vscode', 'extensions');
    if (fs.existsSync(extDir)) {
      try {
        const files = fs.readdirSync(extDir);
        return files.some(f => f.toLowerCase().includes(pattern.toLowerCase()));
      } catch {
        return false;
      }
    }
    return false;
  };

  agents.claudeCode = checkCommand('claude') || fs.existsSync(path.join(os.homedir(), '.claudecode'));
  agents.antigravity = checkCommand('antigravity') || checkCommand('agy') || checkVscodeExtension('antigravity');
  agents.geminiCli = checkCommand('gemini') || checkVscodeExtension('gemini');
  agents.cursor = checkCommand('cursor') || checkVscodeExtension('cursor');
  agents.codeBuddy = checkCommand('codebuddy') || checkCommand('buddy') || checkVscodeExtension('codebuddy');
  agents.codex = checkCommand('codex') || checkVscodeExtension('codex');
  agents.openCode = checkCommand('opencode') || checkVscodeExtension('opencode');
  agents.kilo = checkCommand('kilo') || checkVscodeExtension('kilo');
  agents.aider = checkCommand('aider');
  agents.copilotCli = checkCommand('github-copilot-cli') || checkCommand('gh-copilot');
  agents.copilotChat = checkVscodeExtension('copilot-chat') || checkVscodeExtension('github.copilot');
  agents.openClaw = checkCommand('openclaw') || checkVscodeExtension('openclaw');
  agents.factoryDroid = checkCommand('factorydroid') || checkVscodeExtension('factorydroid');
  agents.trae = checkCommand('trae') || checkVscodeExtension('trae') || fs.existsSync(path.join(os.homedir(), 'AppData', 'Local', 'Programs', 'Trae'));
  agents.traeCn = checkCommand('trae-cn') || fs.existsSync(path.join(os.homedir(), 'AppData', 'Local', 'Programs', 'Trae_CN'));
  agents.hermes = checkCommand('hermes') || checkVscodeExtension('hermes');
  agents.kiro = checkCommand('kiro') || checkVscodeExtension('kiro');
  agents.pi = checkCommand('pi') || checkCommand('pi-agent') || checkVscodeExtension('pi');
  agents.devin = checkCommand('devin') || checkCommand('devin-cli');
  agents.cline = checkCommand('cline') || checkVscodeExtension('claude-dev') || checkVscodeExtension('roo-cline');

  return agents;
}