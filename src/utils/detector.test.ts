import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { detectWorkspace, detectInstalledAgents } from './detector.js';

const TEMP_TEST_DIR = path.join(os.tmpdir(), 'jpa-test-workspace');

describe('Workspace Detector Utility', () => {
  beforeEach(() => {
    if (fs.existsSync(TEMP_TEST_DIR)) {
      fs.rmSync(TEMP_TEST_DIR, { recursive: true, force: true });
    }
    fs.mkdirSync(TEMP_TEST_DIR);
  });

  afterEach(() => {
    if (fs.existsSync(TEMP_TEST_DIR)) {
      fs.rmSync(TEMP_TEST_DIR, { recursive: true, force: true });
    }
  });

  it('should detect Cursor if .cursorrules exists', () => {
    fs.writeFileSync(path.join(TEMP_TEST_DIR, '.cursorrules'), '');
    const env = detectWorkspace(TEMP_TEST_DIR);
    expect(env.cursor).toBe(true);
  });

  it('should detect Claude Code if .claudecoderc exists', () => {
    fs.writeFileSync(path.join(TEMP_TEST_DIR, '.claudecoderc'), '');
    const env = detectWorkspace(TEMP_TEST_DIR);
    expect(env.claude).toBe(true);
  });

  it('should detect Copilot if .github/copilot-instructions.md exists', () => {
    fs.mkdirSync(path.join(TEMP_TEST_DIR, '.github'));
    fs.writeFileSync(path.join(TEMP_TEST_DIR, '.github', 'copilot-instructions.md'), '');
    const env = detectWorkspace(TEMP_TEST_DIR);
    expect(env.copilot).toBe(true);
  });

  it('should detect Git repository if .git directory exists', () => {
    fs.mkdirSync(path.join(TEMP_TEST_DIR, '.git'));
    const env = detectWorkspace(TEMP_TEST_DIR);
    expect(env.git).toBe(true);
  });

  it('should detect VS Code if .vscode directory exists', () => {
    fs.mkdirSync(path.join(TEMP_TEST_DIR, '.vscode'));
    const env = detectWorkspace(TEMP_TEST_DIR);
    expect(env.vscode).toBe(true);
  });

  it('should detect CLAUDE.md file', () => {
    fs.writeFileSync(path.join(TEMP_TEST_DIR, 'CLAUDE.md'), '');
    const env = detectWorkspace(TEMP_TEST_DIR);
    expect(env.claudeMd).toBe(true);
  });

  it('should detect Cursor rules directory', () => {
    fs.mkdirSync(path.join(TEMP_TEST_DIR, '.cursor'));
    fs.mkdirSync(path.join(TEMP_TEST_DIR, '.cursor', 'rules'));
    const env = detectWorkspace(TEMP_TEST_DIR);
    expect(env.cursorDir).toBe(true);
  });

  it('should detect Windsurf rules', () => {
    fs.writeFileSync(path.join(TEMP_TEST_DIR, '.windsurfrules'), '');
    const env = detectWorkspace(TEMP_TEST_DIR);
    expect(env.windsurf).toBe(true);
  });

  it('should detect AGENTS.md file', () => {
    fs.writeFileSync(path.join(TEMP_TEST_DIR, 'AGENTS.md'), '');
    const env = detectWorkspace(TEMP_TEST_DIR);
    expect(env.agentsMd).toBe(true);
  });

  it('should detect AGENTS.md in .agents dir', () => {
    fs.mkdirSync(path.join(TEMP_TEST_DIR, '.agents'));
    fs.writeFileSync(path.join(TEMP_TEST_DIR, '.agents', 'AGENTS.md'), '');
    const env = detectWorkspace(TEMP_TEST_DIR);
    expect(env.agentsMd).toBe(true);
  });

  it('should detect Aider rules', () => {
    fs.writeFileSync(path.join(TEMP_TEST_DIR, '.aider.instructions.md'), '');
    const env = detectWorkspace(TEMP_TEST_DIR);
    expect(env.aiderRules).toBe(true);
  });

  it('should detect Trae rules', () => {
    fs.writeFileSync(path.join(TEMP_TEST_DIR, '.traerules'), '');
    const env = detectWorkspace(TEMP_TEST_DIR);
    expect(env.traerules).toBe(true);
  });

  it('should detect Devin instructions', () => {
    fs.mkdirSync(path.join(TEMP_TEST_DIR, '.devin'));
    fs.writeFileSync(path.join(TEMP_TEST_DIR, '.devin', 'instructions.md'), '');
    const env = detectWorkspace(TEMP_TEST_DIR);
    expect(env.devinDir).toBe(true);
  });

  it('should detect Devin instructions (alt location)', () => {
    fs.writeFileSync(path.join(TEMP_TEST_DIR, '.devin-instructions'), '');
    const env = detectWorkspace(TEMP_TEST_DIR);
    expect(env.devinDir).toBe(true);
  });

  it('should detect CodeBuddy config', () => {
    fs.writeFileSync(path.join(TEMP_TEST_DIR, '.codebuddyrc'), '');
    const env = detectWorkspace(TEMP_TEST_DIR);
    expect(env.codebuddyrc).toBe(true);
  });

  it('should detect Codex rules', () => {
    fs.writeFileSync(path.join(TEMP_TEST_DIR, '.codexrules'), '');
    const env = detectWorkspace(TEMP_TEST_DIR);
    expect(env.codexrules).toBe(true);
  });

  it('should detect OpenCode rules', () => {
    fs.writeFileSync(path.join(TEMP_TEST_DIR, '.opencoderules'), '');
    const env = detectWorkspace(TEMP_TEST_DIR);
    expect(env.opencoderules).toBe(true);
  });

  it('should detect Kilo rules', () => {
    fs.writeFileSync(path.join(TEMP_TEST_DIR, '.kilorules'), '');
    const env = detectWorkspace(TEMP_TEST_DIR);
    expect(env.kilorules).toBe(true);
  });

  it('should detect Kiro rules', () => {
    fs.writeFileSync(path.join(TEMP_TEST_DIR, '.kirorules'), '');
    const env = detectWorkspace(TEMP_TEST_DIR);
    expect(env.kirorules).toBe(true);
  });

  it('should detect OpenClaw rules', () => {
    fs.writeFileSync(path.join(TEMP_TEST_DIR, '.openclawrules'), '');
    const env = detectWorkspace(TEMP_TEST_DIR);
    expect(env.openclawrules).toBe(true);
  });

  it('should detect Factory Droid rules', () => {
    fs.writeFileSync(path.join(TEMP_TEST_DIR, '.factorydroidrules'), '');
    const env = detectWorkspace(TEMP_TEST_DIR);
    expect(env.factorydroidrules).toBe(true);
  });

  it('should detect Hermes rules', () => {
    fs.writeFileSync(path.join(TEMP_TEST_DIR, '.hermesrules'), '');
    const env = detectWorkspace(TEMP_TEST_DIR);
    expect(env.hermesrules).toBe(true);
  });

  it('should detect NodeJS project type from package.json', () => {
    fs.writeFileSync(path.join(TEMP_TEST_DIR, 'package.json'), '{}');
    const env = detectWorkspace(TEMP_TEST_DIR);
    expect(env.projectType).toBe('NodeJS/JavaScript');
  });

  it('should detect PHP project type from composer.json', () => {
    fs.writeFileSync(path.join(TEMP_TEST_DIR, 'composer.json'), '{}');
    const env = detectWorkspace(TEMP_TEST_DIR);
    expect(env.projectType).toBe('PHP/Laravel');
  });

  it('should detect Python project type from requirements.txt', () => {
    fs.writeFileSync(path.join(TEMP_TEST_DIR, 'requirements.txt'), '');
    const env = detectWorkspace(TEMP_TEST_DIR);
    expect(env.projectType).toBe('Python');
  });

  it('should detect Python project type from pyproject.toml', () => {
    fs.writeFileSync(path.join(TEMP_TEST_DIR, 'pyproject.toml'), '');
    const env = detectWorkspace(TEMP_TEST_DIR);
    expect(env.projectType).toBe('Python');
  });

  it('should detect Rust project type from Cargo.toml', () => {
    fs.writeFileSync(path.join(TEMP_TEST_DIR, 'Cargo.toml'), '');
    const env = detectWorkspace(TEMP_TEST_DIR);
    expect(env.projectType).toBe('Rust');
  });

  it('should detect Go project type from go.mod', () => {
    fs.writeFileSync(path.join(TEMP_TEST_DIR, 'go.mod'), '');
    const env = detectWorkspace(TEMP_TEST_DIR);
    expect(env.projectType).toBe('Go');
  });

  // --- Extended framework detection ---
  it('should detect Ruby project type from Gemfile', () => {
    fs.writeFileSync(path.join(TEMP_TEST_DIR, 'Gemfile'), '');
    const env = detectWorkspace(TEMP_TEST_DIR);
    expect(env.projectType).toBe('Ruby');
  });

  it('should detect Flutter/Dart project type from pubspec.yaml', () => {
    fs.writeFileSync(path.join(TEMP_TEST_DIR, 'pubspec.yaml'), '');
    const env = detectWorkspace(TEMP_TEST_DIR);
    expect(env.projectType).toBe('Flutter/Dart');
  });

  it('should detect .NET/C# project type from .csproj files', () => {
    fs.writeFileSync(path.join(TEMP_TEST_DIR, 'MyProject.csproj'), '');
    const env = detectWorkspace(TEMP_TEST_DIR);
    expect(env.projectType).toBe('.NET/C#');
  });

  it('should detect .NET/C# project type from global.json', () => {
    fs.writeFileSync(path.join(TEMP_TEST_DIR, 'global.json'), '{}');
    const env = detectWorkspace(TEMP_TEST_DIR);
    expect(env.projectType).toBe('.NET/C#');
  });

  it('should detect Swift/iOS project type from Package.swift', () => {
    fs.writeFileSync(path.join(TEMP_TEST_DIR, 'Package.swift'), '');
    const env = detectWorkspace(TEMP_TEST_DIR);
    expect(env.projectType).toBe('Swift/iOS');
  });

  it('should detect Swift/iOS project type from .xcodeproj', () => {
    fs.mkdirSync(path.join(TEMP_TEST_DIR, 'MyApp.xcodeproj'));
    const env = detectWorkspace(TEMP_TEST_DIR);
    expect(env.projectType).toBe('Swift/iOS');
  });

  it('should detect Deno project type from deno.json', () => {
    fs.writeFileSync(path.join(TEMP_TEST_DIR, 'deno.json'), '{}');
    const env = detectWorkspace(TEMP_TEST_DIR);
    expect(env.projectType).toBe('Deno');
  });

  it('should detect Deno project type from deno.jsonc', () => {
    fs.writeFileSync(path.join(TEMP_TEST_DIR, 'deno.jsonc'), '{}');
    const env = detectWorkspace(TEMP_TEST_DIR);
    expect(env.projectType).toBe('Deno');
  });

  it('should return null projectType for unknown project types', () => {
    fs.writeFileSync(path.join(TEMP_TEST_DIR, 'some_random_file.txt'), '');
    const env = detectWorkspace(TEMP_TEST_DIR);
    expect(env.projectType).toBeNull();
  });

  it('should detect multiple configs in same workspace', () => {
    fs.writeFileSync(path.join(TEMP_TEST_DIR, '.cursorrules'), '');
    fs.writeFileSync(path.join(TEMP_TEST_DIR, '.claudecoderc'), '');
    fs.writeFileSync(path.join(TEMP_TEST_DIR, '.windsurfrules'), '');
    fs.writeFileSync(path.join(TEMP_TEST_DIR, 'AGENTS.md'), '');
    fs.writeFileSync(path.join(TEMP_TEST_DIR, 'package.json'), '{}');
    fs.mkdirSync(path.join(TEMP_TEST_DIR, '.git'));
    const env = detectWorkspace(TEMP_TEST_DIR);
    expect(env.cursor).toBe(true);
    expect(env.claude).toBe(true);
    expect(env.windsurf).toBe(true);
    expect(env.agentsMd).toBe(true);
    expect(env.git).toBe(true);
    expect(env.projectType).toBe('NodeJS/JavaScript');
  });

  it('should return installed agents keys', () => {
    const agents = detectInstalledAgents();
    expect(agents).toHaveProperty('claudeCode');
    expect(agents).toHaveProperty('antigravity');
    expect(agents).toHaveProperty('geminiCli');
    expect(agents).toHaveProperty('cline');
    expect(agents).toHaveProperty('codex');
    expect(agents).toHaveProperty('kilo');
    expect(agents).toHaveProperty('openCode');
    expect(agents).toHaveProperty('copilotCli');
    expect(agents).toHaveProperty('copilotChat');
    expect(agents).toHaveProperty('cursor');
    expect(agents).toHaveProperty('codeBuddy');
    expect(agents).toHaveProperty('aider');
    expect(agents).toHaveProperty('pi');
    expect(agents).toHaveProperty('kiro');
    expect(agents).toHaveProperty('hermes');
    expect(agents).toHaveProperty('openClaw');
    expect(agents).toHaveProperty('factoryDroid');
    expect(agents).toHaveProperty('trae');
    expect(agents).toHaveProperty('traeCn');
    expect(agents).toHaveProperty('devin');
  });

  it('should have all agent properties as booleans', () => {
    const agents = detectInstalledAgents();
    for (const [key, value] of Object.entries(agents)) {
      expect(typeof value, `Property ${key} should be boolean`).toBe('boolean');
    }
  });
});