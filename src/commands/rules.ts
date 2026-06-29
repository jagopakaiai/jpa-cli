import fs from 'fs';
import path from 'path';
import * as p from '@clack/prompts';
import pc from 'picocolors';
import { detectWorkspace } from '../utils/detector.js';

/** Lazily resolves backup directory based on current working directory */
function getBackupDir(): string {
  return path.join(process.cwd(), '.jagopakaiai-backups');
}

const RULE_FILE_NAMES: Record<string, string> = {
  '.cursorrules': 'Cursor Rules',
  '.cursor/rules/jagopakaiai.md': 'Cursor Rules Dir',
  '.claudecoderc': 'Claude Code Config',
  'CLAUDE.md': 'Claude MD Instructions',
  '.github/copilot-instructions.md': 'GitHub Copilot Instructions',
  '.windsurfrules': 'Windsurf Rules',
  '.aider.instructions.md': 'Aider Instructions',
  '.traerules': 'Trae Rules',
  '.devin/instructions.md': 'Devin Instructions',
  '.codebuddyrc': 'CodeBuddy Config',
  '.codexrules': 'Codex Rules',
  '.opencoderules': 'OpenCode Rules',
  '.kilorules': 'Kilo Rules',
  '.kirorules': 'Kiro Rules',
  '.openclawrules': 'OpenClaw Rules',
  '.factorydroidrules': 'Factory Droid Rules',
  '.hermesrules': 'Hermes Rules',
  'AGENTS.md': 'Agents MD',
  '.agents/AGENTS.md': 'Agents MD (Agents Dir)',
  '.clinerules': 'Cline Rules',
};

export function getDetectedRuleFiles(dir: string): { name: string; path: string; label: string }[] {
  const found: { name: string; path: string; label: string }[] = [];
  for (const [fileName, label] of Object.entries(RULE_FILE_NAMES)) {
    const fullPath = path.join(dir, fileName);
    if (fs.existsSync(fullPath)) {
      found.push({ name: fileName, path: fullPath, label });
    }
  }
  return found;
}

export async function rulesListCommand() {
  p.intro('Workspace Rule Files');
  const env = detectWorkspace(process.cwd());
  const rules = getDetectedRuleFiles(process.cwd());

  if (rules.length === 0) {
    p.log.warn('No AI agent rule files detected in this workspace.');
    p.outro(`Run ${pc.cyan('jagopakaiai-cli agent install')} to create rule files.`);
    return;
  }

  const rows = rules.map(r => {
    const stats = fs.statSync(r.path);
    const sizeKb = (stats.size / 1024).toFixed(1);
    const modified = stats.mtime.toLocaleDateString();
    const hasJago = fs.readFileSync(r.path, 'utf-8').includes('JagoPakaiAI');
    return `${hasJago ? pc.green('●') : pc.yellow('○')} ${pc.bold(r.name.padEnd(40))} ${pc.dim((sizeKb + ' KB').padStart(8))}  ${pc.dim(modified)}  ${r.label}`;
  }).join('\n');

  p.note(rows, `Rule Files (${rules.length} found)`);

  const action = await p.select({
    message: 'Select action:',
    options: [
      { value: 'view', label: '👁️ View a rule file' },
      { value: 'backup', label: '💾 Backup all rule files' },
      { value: 'clean', label: '🧹 Remove JagoPakaiAI sections' },
      { value: 'back', label: '🔙 Back' }
    ]
  });

  if (p.isCancel(action) || action === 'back') return;

  if (action === 'view') {
    const choice = await p.select({
      message: 'Select a rule file to view:',
      options: rules.map(r => ({ value: r.name, label: `${r.name} — ${r.label}` }))
    });
    if (!p.isCancel(choice)) {
      await rulesViewCommand(choice as string);
    }
  } else if (action === 'backup') {
    await rulesBackupCommand();
  } else if (action === 'clean') {
    await rulesCleanCommand();
  }
}

export async function rulesViewCommand(name: string) {
  const resolvedPath = path.isAbsolute(name) ? name : path.join(process.cwd(), name);
  if (!fs.existsSync(resolvedPath)) {
    p.log.error(`File not found: ${resolvedPath}`);
    return;
  }
  const content = fs.readFileSync(resolvedPath, 'utf-8');
  const label = RULE_FILE_NAMES[name] || path.basename(name);
  p.intro(`View: ${label} (${name})`);
  p.note(content.length > 2000 ? content.substring(0, 2000) + '\n\n... (truncated)' : content, `Content (${content.length} chars)`);
  p.outro('End of file.');
}

export async function rulesBackupCommand() {
  const s = p.spinner();
  s.start('Scanning for rule files...');
  const rules = getDetectedRuleFiles(process.cwd());
  s.stop(`Found ${rules.length} rule files.`);

  if (rules.length === 0) {
    p.log.warn('No rule files to backup.');
    return;
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
  const backupDir = getBackupDir();
  const backupPath = path.join(backupDir, `backup-${timestamp}`);

  s.start('Creating backup...');
  if (!fs.existsSync(backupPath)) {
    fs.mkdirSync(backupPath, { recursive: true });
  }

  let count = 0;
  for (const rule of rules) {
    const relativePath = path.relative(process.cwd(), rule.path);
    const destPath = path.join(backupPath, relativePath);
    const destDir = path.dirname(destPath);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    fs.copyFileSync(rule.path, destPath);
    count++;
  }

  const manifest = {
    timestamp,
    files: rules.map(r => ({ name: r.name, label: r.label })),
    count
  };
  fs.writeFileSync(path.join(backupPath, 'manifest.json'), JSON.stringify(manifest, null, 2));
  s.stop('Backup complete!');

  p.log.success(`Backup created: ${backupPath}`);
  p.log.success(`Files backed up: ${count}`);
  p.outro('Backup completed successfully.');
}

export async function rulesRestoreCommand() {
  const backupDir = getBackupDir();
  if (!fs.existsSync(backupDir)) {
    p.log.warn('No backups found. Run backup first.');
    return;
  }

  const backups = fs.readdirSync(backupDir)
    .filter(d => d.startsWith('backup-'))
    .sort()
    .reverse();

  if (backups.length === 0) {
    p.log.warn('No backups found.');
    return;
  }

  const choice = await p.select({
    message: 'Select a backup to restore:',
    options: backups.map(b => ({
      value: b,
      label: b.replace('backup-', '').replace(/-/g, ' ').substring(0, 19),
      hint: `${fs.readdirSync(path.join(backupDir, b)).length} files`
    }))
  });

  if (p.isCancel(choice)) return;

  const backupPath = path.join(backupDir, choice as string);
  const manifestPath = path.join(backupPath, 'manifest.json');

  if (!fs.existsSync(manifestPath)) {
    p.log.error('Backup manifest not found. Cannot restore.');
    return;
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

  p.log.warn(`This will overwrite ${manifest.count} rule file(s).`);

  const confirm = await p.confirm({
    message: 'Are you sure?',
    initialValue: false
  });

  if (p.isCancel(confirm) || !confirm) {
    p.cancel('Restore cancelled.');
    return;
  }

  const s = p.spinner();
  s.start('Restoring files...');

  const restoreFiles = (item: string) => {
    const sourcePath = path.join(backupPath, item);
    const destPath = path.join(process.cwd(), item);
    const destDir = path.dirname(destPath);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    fs.copyFileSync(sourcePath, destPath);
    p.log.success(`Restored: ${item}`);
  };

  for (const f of manifest.files) {
    restoreFiles(f.name);
  }

  s.stop('Restore complete!');
  p.outro(`Restored ${manifest.count} files from backup.`);
}

export async function rulesCleanCommand() {
  p.intro('Clean JagoPakaiAI Sections');
  p.log.warn('This will scan all AI rule files and remove managed JagoPakaiAI sections.');

  const rules = getDetectedRuleFiles(process.cwd());

  if (rules.length === 0) {
    p.log.warn('No rule files found to clean.');
    return;
  }

  const JAGO_MARKER_START = /^<!\s*--\s*jagopakaiai:.*:start\s*-->$/m;
  const JAGO_MARKER_END = /^<!\s*--\s*jagopakaiai:.*:end\s*-->$/m;

  const filesToClean: { name: string; path: string }[] = [];
  for (const rule of rules) {
    const content = fs.readFileSync(rule.path, 'utf-8');
    if (JAGO_MARKER_START.test(content) || content.includes('managed by JagoPakaiAI') || content.includes('JagoPakaiAI')) {
      filesToClean.push(rule);
    }
  }

  if (filesToClean.length === 0) {
    p.log.success('No JagoPakaiAI-managed content found in rule files.');
    return;
  }

  p.log.info(`Found JagoPakaiAI content in ${filesToClean.length} file(s).`);

  for (const file of filesToClean) {
    p.log.info(`  ${file.name}`);
  }

  const mode = await p.select({
    message: 'Select cleaning mode:',
    options: [
      { value: 'sections', label: '🧹 Remove only JagoPakaiAI delimited sections' },
      { value: 'all', label: '🗑️ Remove ALL JagoPakaiAI-managed files' },
      { value: 'cancel', label: '🔙 Cancel' }
    ]
  });

  if (p.isCancel(mode) || mode === 'cancel') return;

  const s = p.spinner();
  s.start('Cleaning...');

  if (mode === 'sections') {
    for (const file of filesToClean) {
      const content = fs.readFileSync(file.path, 'utf-8');
      const cleaned = content
        .split('\n')
        .filter(line => !line.includes('managed by JagoPakaiAI') && !line.includes('<!-- jagopakaiai:'))
        .join('\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
      fs.writeFileSync(file.path, cleaned + '\n');
    }
    s.stop('Sections removed!');
  } else {
    for (const file of filesToClean) {
      fs.unlinkSync(file.path);
      p.log.success(`Deleted: ${file.name}`);
    }
    s.stop('Files deleted!');
  }

  p.outro('Clean completed.');
}

export async function rulesTemplateCommand(type?: string) {
  p.intro('Generate Rule Template');

  const choices = [
    { value: '.cursorrules', label: 'Cursor Rules (.cursorrules)' },
    { value: 'CLAUDE.md', label: 'Claude MD (CLAUDE.md)' },
    { value: '.claudecoderc', label: 'Claude Code (.claudecoderc)' },
    { value: '.github/copilot-instructions.md', label: 'GitHub Copilot Instructions' },
    { value: 'AGENTS.md', label: 'Agents MD (AGENTS.md)' },
    { value: '.windsurfrules', label: 'Windsurf Rules' },
    { value: '.aider.instructions.md', label: 'Aider Instructions' },
    { value: '.traerules', label: 'Trae Rules' }
  ];

  let selected: string;
  if (type) {
    selected = type.startsWith('.') ? type : `.${type}`;
    if (!choices.find(c => c.value === selected)) {
      p.log.warn(`Unknown template type "${type}".`);
      const pick = await p.select({ message: 'Select template type:', options: choices });
      if (p.isCancel(pick)) return;
      selected = pick as string;
    }
  } else {
    const pick = await p.select({ message: 'Select template type:', options: choices });
    if (p.isCancel(pick)) return;
    selected = pick as string;
  }

  const contentMap: Record<string, string> = {
    '.cursorrules': `# Project Rules for AI Coding Agents
# Managed by JagoPakaiAI CLI

## Project Context
- This file provides instructions for AI coding agents working on this project.
- Edit this file to customize agent behavior.

## Coding Standards
- Follow the existing code style and conventions.
- Write clean, maintainable code.
- Include tests for new functionality.

## Best Practices
- Keep functions small and focused.
- Use meaningful variable and function names.
- Document complex logic with comments.
`,
    'CLAUDE.md': `# CLAUDE.md — Project Guide for Claude Code
# Managed by JagoPakaiAI CLI

## Project Overview
- Describe your project here.

## Commands
- Build: \`npm run build\`
- Test: \`npm test\`
- Lint: \`npm run lint\`

## Code Style
- TypeScript with strict mode.
- Use ES modules.
- Follow existing patterns.
`,
    '.claudecoderc': `{
  // Claude Code configuration (managed by JagoPakaiAI CLI)
  "model": "claude-sonnet-4-6",
  "allowedTools": ["Read", "Edit", "Bash", "Task"],
  "systemInstructions": "Follow the project guidelines in CLAUDE.md"
}
`,
    '.github/copilot-instructions.md': `# GitHub Copilot Instructions
# Managed by JagoPakaiAI CLI

## Language
- TypeScript/JavaScript for this project.

## Style
- Use functional programming patterns.
- Prefer async/await over callbacks.

## Testing
- Write unit tests with vitest.
- Aim for 80%+ code coverage.
`,
    'AGENTS.md': `# AGENTS.md — Instructions for AI Coding Agents
# Managed by JagoPakaiAI CLI

## Supported Agents
- Google Gemini CLI
- Google Antigravity
- Pi coding agent

## Project Rules
- Describe your project's architecture and conventions here.
- Include build and test commands.
- Specify coding standards and best practices.

## Development Workflow
1. Understand the requirements before coding.
2. Write tests first when possible.
3. Keep changes focused and small.
4. Verify with tests before completing.
`,
    '.windsurfrules': `# Windsurf AI Rules
# Managed by JagoPakaiAI CLI

## Development Guidelines
- Write clean, maintainable code.
- Follow project conventions.
- Include tests.

## Code Generation
- Prefer simple solutions over complex ones.
- Avoid unnecessary dependencies.
- Document public APIs.
`,
    '.aider.instructions.md': `# Aider AI Instructions
# Managed by JagoPakaiAI CLI

## Project Setup
- Build command: npm run build
- Test command: npm test

## Coding Preferences
- Use TypeScript with strict typing.
- Follow existing patterns.
- Write tests for new code.

## Architecture
- Describe your project's architecture here.
`,
    '.traerules': `# Trae AI IDE Rules
# Managed by JagoPakaiAI CLI

## Project Information
- Add your project description here.

## Development Rules
- Keep code clean and organized.
- Follow project-specific conventions.
- Test all changes.
`,
  };

  const content = contentMap[selected] || `# ${selected} — AI Agent Rules
# Managed by JagoPakaiAI CLI

# Add your project-specific instructions here.
`;

  p.note(content, `Template for ${selected}`);

  const save = await p.confirm({
    message: `Save to ${selected} in current directory?`,
    initialValue: false
  });

  if (p.isCancel(save) || !save) {
    p.outro('Template not saved.');
    return;
  }

  const fullPath = path.join(process.cwd(), selected);
  const parentDir = path.dirname(fullPath);
  if (parentDir && !fs.existsSync(parentDir)) {
    fs.mkdirSync(parentDir, { recursive: true });
  }

  if (fs.existsSync(fullPath)) {
    const overwrite = await p.confirm({
      message: 'File already exists. Overwrite?',
      initialValue: false
    });
    if (p.isCancel(overwrite) || !overwrite) {
      p.outro('Save cancelled.');
      return;
    }
  }

  fs.writeFileSync(fullPath, content);
  p.log.success(`Saved template to: ${fullPath}`);
  p.outro('Template created successfully!');
}
