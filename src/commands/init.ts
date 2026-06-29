import fs from 'fs';
import path from 'path';
import * as p from '@clack/prompts';
import { detectInstalledAgents } from '../utils/detector.js';
import { getApiKey } from '../utils/config.js';
import { fetchSkillRule } from '../utils/api.js';

export async function initCommand() {
  p.intro('JagoPakaiAI Project Initializer & PRD Generator');

  // 1. Detect Installed AI Agents
  const s = p.spinner();
  s.start('Detecting installed AI agents on your system...');
  const agents = detectInstalledAgents();
  s.stop('Detection complete!');

  const installedList: string[] = [];
  if (agents.geminiCli) installedList.push('Gemini CLI');
  if (agents.cursor) installedList.push('Cursor');
  if (agents.claudeCode) installedList.push('Claude Code');
  if (agents.codeBuddy) installedList.push('CodeBuddy');
  if (agents.codex) installedList.push('Codex');
  if (agents.openCode) installedList.push('OpenCode');
  if (agents.kilo) installedList.push('Kilo');
  if (agents.aider) installedList.push('Aider');
  if (agents.copilotCli) installedList.push('GitHub Copilot CLI');
  if (agents.copilotChat) installedList.push('VS Code Copilot Chat');
  if (agents.openClaw) installedList.push('OpenClaw');
  if (agents.factoryDroid) installedList.push('Factory Droid');
  if (agents.trae) installedList.push('Trae');
  if (agents.traeCn) installedList.push('Trae CN');
  if (agents.antigravity) installedList.push('Google Antigravity');
  if (agents.hermes) installedList.push('Hermes');
  if (agents.kiro) installedList.push('Kiro IDE/CLI');
  if (agents.pi) installedList.push('Pi coding agent');
  if (agents.devin) installedList.push('Devin CLI');
  if (agents.cline) installedList.push('Cline/Roo-Code');

  if (installedList.length > 0) {
    p.log.success(`Detected AI Agents: ${installedList.join(', ')}`);
  } else {
    p.log.warn('No active AI agents detected on the standard system path/extensions. (You can still configure configs manually)');
  }

  // 2. Interactive Prompts
  const projectName = await p.text({
    message: 'Enter your project name:',
    placeholder: 'my-awesome-app',
    validate: (value) => {
      if (!value || value.trim().length === 0) return 'Project name is required!';
    }
  });
  if (p.isCancel(projectName)) {
    p.cancel('Initialization cancelled.');
    return;
  }

  const projectType = await p.select({
    message: 'Select project technology stack / type:',
    options: [
      { value: 'NodeJS/TypeScript', label: 'NodeJS & TypeScript (esbuild, ts-node)' },
      { value: 'PHP/Laravel', label: 'PHP & Laravel (Blade, Composer)' },
      { value: 'Python', label: 'Python (Django, Flask, Poetry)' },
      { value: 'Rust', label: 'Rust (Cargo, Bin/Lib)' },
      { value: 'Go', label: 'Go (Go Modules)' },
      { value: 'HTML/CSS/JS', label: 'Frontend Vanilla (HTML, CSS, Vanilla JS)' }
    ]
  });
  if (p.isCancel(projectType)) {
    p.cancel('Initialization cancelled.');
    return;
  }

  const projectGoal = await p.text({
    message: 'Enter the main goal / description of this project:',
    placeholder: 'Build a secure API gateway with rate limiting and logging',
    validate: (value) => {
      if (!value || value.trim().length === 0) return 'Project goal is required!';
    }
  });
  if (p.isCancel(projectGoal)) {
    p.cancel('Initialization cancelled.');
    return;
  }

  const workflow = await p.select({
    message: 'Select development workflow style:',
    options: [
      { value: 'Test-Driven Development (TDD)', label: 'Test-Driven Development (TDD)' },
      { value: 'Feature-Driven Development', label: 'Feature-Driven Development (FDD)' },
      { value: 'Standard Agile/Iterative', label: 'Standard Agile / Rapid Prototyping' }
    ]
  });
  if (p.isCancel(workflow)) {
    p.cancel('Initialization cancelled.');
    return;
  }

  // 3. Selection of AI configuration files to create
  const fileOptions = [
    { value: '.cursorrules', label: 'Cursor Rules (.cursorrules)' },
    { value: '.cursor/rules/jagopakaiai.md', label: 'Cursor Rules Dir (.cursor/rules/)' },
    { value: '.claudecoderc', label: 'Claude Code (.claudecoderc)' },
    { value: 'CLAUDE.md', label: 'Claude MD (CLAUDE.md)' },
    { value: '.github/copilot-instructions.md', label: 'GitHub Copilot (.github/copilot-instructions.md)' },
    { value: 'AGENTS.md', label: 'Agents MD (AGENTS.md) - Gemini/Antigravity/Pi' },
    { value: '.aider.instructions.md', label: 'Aider Rules (.aider.instructions.md)' },
    { value: '.traerules', label: 'Trae Rules (.traerules)' },
    { value: '.devin/instructions.md', label: 'Devin Rules (.devin/instructions.md)' },
    { value: '.codebuddyrc', label: 'CodeBuddy Config (.codebuddyrc)' },
    { value: '.codexrules', label: 'Codex Rules (.codexrules)' },
    { value: '.opencoderules', label: 'OpenCode Rules (.opencoderules)' },
    { value: '.kilorules', label: 'Kilo Rules (.kilorules)' },
    { value: '.kirorules', label: 'Kiro Rules (.kirorules)' },
    { value: '.openclawrules', label: 'OpenClaw Rules (.openclawrules)' },
    { value: '.factorydroidrules', label: 'Factory Droid Rules (.factorydroidrules)' },
    { value: '.hermesrules', label: 'Hermes Rules (.hermesrules)' },
    { value: '.windsurfrules', label: 'Windsurf Rules (.windsurfrules)' }
  ];
  const selectedFiles = await p.multiselect({
    message: 'Select AI rule configs to generate for this workspace:',
    options: fileOptions,
    required: false
  });
  if (p.isCancel(selectedFiles)) {
    p.cancel('Initialization cancelled.');
    return;
  }

  // 4. MCP & Skills integration
  const shouldSyncSkill = await p.confirm({
    message: 'Do you want to fetch and synchronize rule instructions for a specific skill profile from the JagoPakaiAI API?',
    initialValue: false
  });
  if (p.isCancel(shouldSyncSkill)) {
    p.cancel('Initialization cancelled.');
    return;
  }

  let skillName = '';
  let skillContent = '';
  if (shouldSyncSkill) {
    const apiKey = getApiKey();
    if (!apiKey) {
      p.log.warn('Authentication required to fetch custom skills. Please run "jagopakaiai-cli login" first. Skipping API sync...');
    } else {
      const inputSkill = await p.text({
        message: 'Enter the skill name slug to sync (e.g. laravel-api-clean, typescript-esm):',
        validate: (value) => {
          if (!value || value.trim().length === 0) return 'Skill name is required!';
        }
      });
      if (!p.isCancel(inputSkill) && inputSkill.trim().length > 0) {
        skillName = inputSkill as string;
        const fetchSpinner = p.spinner();
        fetchSpinner.start(`Fetching skill "${skillName}" rules...`);
        try {
          skillContent = await fetchSkillRule(apiKey, skillName);
          fetchSpinner.stop(`Fetched skill "${skillName}"!`);
        } catch (err: any) {
          fetchSpinner.stop('Fetch failed!');
          p.log.error(`API Error: ${err.message || String(err)}. Proceeding with fallback local configs.`);
        }
      }
    }
  }

  // 5. Generate config files
  const writeSpinner = p.spinner();
  writeSpinner.start('Writing workspace configurations...');
  const currentDir = process.cwd();

  // Create base instructions content based on Stack and Workflow
  const baseRules = [
    `# AI Rules for ${projectName}`,
    `- Project Stack: ${projectType}`,
    `- Workflow Mode: ${workflow}`,
    `- Goal: ${projectGoal}`,
    '',
    '## General Coding Standards',
    '- Keep files small, modular, and focused on a single responsibility.',
    '- Write unit tests for all logical handlers and utilities.',
    '- Maintain clean error handling and avoid placeholders or incomplete code blocks.',
    skillContent ? `\n## Integrated Skill Rules (${skillName})\n${skillContent}` : ''
  ].join('\n');

  for (const filename of (selectedFiles as string[])) {
    const fullPath = path.join(currentDir, filename);
    const parentDir = path.dirname(fullPath);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }
    fs.writeFileSync(fullPath, baseRules);
    p.log.success(`Generated config: ${filename}`);
  }
  writeSpinner.stop('Workspace configurations completed!');

  // 6. Generate PRD
  const prdSpinner = p.spinner();
  prdSpinner.start('Generating Product Requirements Document (PRD.md)...');

  const prdContent = [
    `# Product Requirements Document (PRD)`,
    `## Project Name: ${projectName}`,
    '',
    '---',
    '',
    '## 1. Executive Summary',
    `**Goal:** ${projectGoal}`,
    `**Technology Stack:** ${projectType}`,
    `**Workflow Methodology:** ${workflow}`,
    '',
    '---',
    '',
    '## 2. Environment & AI Configuration',
    `This project is configured with rules for the following AI Agents / Editors:`,
    (selectedFiles as string[]).map(f => `- **${f}**`).join('\n') || '- None selected',
    '',
    '### System AI Agents Detected:',
    installedList.map(a => `- ${a} (Installed)`).join('\n') || '- No specific agents detected on local PATH.',
    '',
    '---',
    '',
    '## 3. Product Architecture & Scope',
    '### 3.1 Key Modules',
    '- **Core Services**: Main business logic handlers.',
    '- **Data Models**: Configuration settings and database storage.',
    '- **Tests Layout**: Validation suites and environment mocks.',
    '',
    '### 3.2 Recommended MCP Packages',
    '- **sqlite-mcp**: For database schema introspection and data operations.',
    '- **fetch-mcp**: For web API communication and testing.',
    '- **filesystem-mcp**: For local system file manipulations.',
    '',
    '---',
    '',
    '## 4. Development Workflow Guidelines',
    `Under the **${workflow}** workflow:`,
    workflow === 'Test-Driven Development (TDD)' 
      ? [
          '1. Write a failing unit test first to describe the new code behavior.',
          '2. Run the test framework and confirm it fails.',
          '3. Implement minimal code to pass the test.',
          '4. Run tests, ensure they pass, and refactor code clean.'
        ].join('\n')
      : workflow === 'Feature-Driven Development'
      ? [
          '1. Design a specification/feature blueprint before writing code.',
          '2. Build features iteratively, task-by-task.',
          '3. Test and integrate upon completing each feature unit.'
        ].join('\n')
      : [
          '1. Build initial core structures and test setups.',
          '2. Implement code modules in short iterations.',
          '3. Refactor codebases continuously during development.'
        ].join('\n'),
    '',
    '---',
    '',
    '## 5. Security & Deployment Details',
    '- Ensure API keys are loaded via environment files and never committed.',
    '- Package compiles using clean separation of dependencies.',
    `- Standalone executables can be built and audited locally.`
  ].join('\n');

  fs.writeFileSync(path.join(currentDir, 'PRD.md'), prdContent);
  prdSpinner.stop('PRD.md generated successfully!');
  p.log.success('PRD file created at: ./PRD.md');

  p.outro('Project initialization completed successfully!');
}