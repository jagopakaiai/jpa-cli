import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { detectWorkspace, detectInstalledAgents } from './detector.js';

const TEMP_TEST_DIR = path.join(os.tmpdir(), 'jagopakai-test-workspace');

describe('Workspace Detector Utility', () => {
  beforeEach(() => {
    if (fs.existsSync(TEMP_TEST_DIR)) {
      fs.rmSync(TEMP_TEST_DIR, { recursive: true, force: true });
    }
    fs.mkdirSync(TEMP_TEST_DIR);
  });

  afterEach(() => {
    fs.rmSync(TEMP_TEST_DIR, { recursive: true, force: true });
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

  it('should return installed agents keys', () => {
    const agents = detectInstalledAgents();
    expect(agents).toHaveProperty('claudeCode');
    expect(agents).toHaveProperty('antigravity');
    expect(agents).toHaveProperty('geminiCli');
    expect(agents).toHaveProperty('cline');
    expect(agents).toHaveProperty('codex');
    expect(agents).toHaveProperty('kilo');
    expect(agents).toHaveProperty('openCode');
  });
});

