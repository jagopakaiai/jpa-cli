import fs from 'fs';
import path from 'path';

export interface SkillMetadata {
  name: string;
  description: string;
  [key: string]: any;
}

export interface ParsedSkill {
  metadata: SkillMetadata;
  body: string;
  isValid: boolean;
  errors: string[];
}

const FRONTMATTER_REGEX = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;

export function parseSkillFile(filePath: string): ParsedSkill {
  const result: ParsedSkill = {
    metadata: { name: '', description: '' },
    body: '',
    isValid: false,
    errors: []
  };

  if (!fs.existsSync(filePath)) {
    result.errors.push('File does not exist.');
    return result;
  }

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const match = content.match(FRONTMATTER_REGEX);

    if (!match) {
      result.errors.push('YAML frontmatter structure (delimited by ---) not found at top of file.');
      return result;
    }

    const yamlBlock = match[1];
    result.body = match[2] || '';

    // Simple YAML parser for key-value strings
    const lines = yamlBlock.split('\n');
    const meta: Record<string, string> = {};

    for (const line of lines) {
      const cleanLine = line.trim();
      if (!cleanLine || cleanLine.startsWith('#')) continue;

      const colonIdx = cleanLine.indexOf(':');
      if (colonIdx === -1) {
        result.errors.push(`Invalid line in YAML frontmatter: "${line}"`);
        continue;
      }

      const key = cleanLine.substring(0, colonIdx).trim();
      let val = cleanLine.substring(colonIdx + 1).trim();

      // Strip quotes if present
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.substring(1, val.length - 1);
      }

      meta[key] = val;
    }

    result.metadata = meta as unknown as SkillMetadata;

    // Validate fields
    if (!result.metadata.name) {
      result.errors.push('Missing required frontmatter property: "name"');
    }
    if (!result.metadata.description) {
      result.errors.push('Missing required frontmatter property: "description"');
    }

    result.isValid = result.errors.length === 0;
  } catch (err: any) {
    result.errors.push(`Parsing failed: ${err.message || String(err)}`);
  }

  return result;
}

import os from 'os';

export function isWorkspaceSkillInstalled(name: string): boolean {
  const currentDir = process.cwd();
  const file = path.join(currentDir, '.agents', 'skills', name, 'SKILL.md');
  return fs.existsSync(file);
}

export function isGlobalSkillInstalled(name: string): boolean {
  const globalSkillsDir = path.join(os.homedir(), '.config', 'jpa-cli', 'skills');
  const file = path.join(globalSkillsDir, name, 'SKILL.md');
  return fs.existsSync(file);
}

export function isSkillSynced(name: string): boolean {
  const currentDir = process.cwd();
  const targets = ['.cursorrules', '.claudecoderc', '.github/copilot-instructions.md'];
  for (const target of targets) {
    const fullPath = path.join(currentDir, target);
    if (fs.existsSync(fullPath)) {
      try {
        const content = fs.readFileSync(fullPath, 'utf-8');
        if (content.includes(`Integrated Skill Rules (${name})`) || 
            content.includes(`Skill: ${name}`) || 
            content.includes(`skills/${name}`)) {
          return true;
        }
      } catch {}
    }
  }
  return false;
}

export function generateSkillTemplate(name: string, description: string): string {
  return [
    '---',
    `name: ${name}`,
    `description: "${description}"`,
    '---',
    '',
    `# Skill: ${name}`,
    '',
    '## Overview',
    `${description}`,
    '',
    '## When to Use',
    '- Trigger conditions for this skill',
    '',
    '## Workflow',
    '1. Step one',
    '2. Step two',
    '3. Step three',
    '',
    '## Instructions',
    '- Detailed instructions for the AI agent',
    '',
    '## Examples',
    '```',
    'Example usage or output',
    '```',
    '',
    '## Troubleshooting',
    '- Common issues and solutions',
    ''
  ].join('\n');
}

export function generateRichSkillContent(params: {
  name: string;
  description: string;
  category: string;
  triggers: string[];
  workflow: string[];
  instructions: string[];
  tools: string[];
}): string {
  const sections: string[] = [
    '---',
    `name: ${params.name}`,
    `description: "${params.description}"`,
    `category: ${params.category}`,
    '---',
    '',
    `# ${params.name}`,
    '',
    '## Overview',
    params.description,
    '',
  ];

  if (params.triggers.length > 0) {
    sections.push('## When to Use');
    sections.push(...params.triggers.map(t => `- ${t}`));
    sections.push('');
  }

  if (params.workflow.length > 0) {
    sections.push('## Workflow');
    sections.push(...params.workflow.map((s, i) => `${i + 1}. ${s}`));
    sections.push('');
  }

  if (params.instructions.length > 0) {
    sections.push('## Instructions');
    sections.push(...params.instructions.map(i => `- ${i}`));
    sections.push('');
  }

  if (params.tools.length > 0) {
    sections.push('## Required Tools / Resources');
    sections.push(...params.tools.map(t => `- ${t}`));
    sections.push('');
  }

  sections.push('## Examples', '```', '```', '', '## Troubleshooting', '- ');
  return sections.join('\n');
}

export interface CuratedSkill {
  name: string;
  description: string;
  url: string;
}

export function parseAwesomeAgentSkills(readmePath: string): CuratedSkill[] {
  const skills: CuratedSkill[] = [];
  if (!fs.existsSync(readmePath)) {
    return skills;
  }
  try {
    const content = fs.readFileSync(readmePath, 'utf-8');
    const lines = content.split('\n');
    const skillRegex = /^\s*-\s*\*\*\[([^\]]+)\]\(([^)]+)\)\*\*\s*-\s*(.*)$/;
    for (const line of lines) {
      const match = line.match(skillRegex);
      if (match) {
        skills.push({
          name: match[1].trim(),
          url: match[2].trim(),
          description: match[3].trim()
        });
      }
    }
  } catch {}
  return skills;
}

export function whiteLabelSkillContent(content: string, name: string, description?: string): string {
  let clean = content
    .replace(/superpowers:using-superpowers/gi, 'jpa-cli:using-skills')
    .replace(/using-superpowers/gi, 'using-skills')
    .replace(/superpowers/gi, 'JPA CLI')
    .replace(/Jesse Vincent/gi, 'JPA CLI Team')
    .replace(/VoltAgent/gi, 'JPA CLI')
    .replace(/officialskills\.sh/gi, 'jpa.my.id');

  if (!clean.trim().startsWith('---')) {
    clean = [
      '---',
      `name: ${name}`,
      `description: "${description || ''}"`,
      '---',
      '',
      clean
    ].join('\n');
  }
  return clean;
}

export function getLocalSkillContent(name: string): string | null {
  // 1. Check workspace
  const currentDir = process.cwd();
  const wsFile = path.join(currentDir, '.agents', 'skills', name, 'SKILL.md');
  if (fs.existsSync(wsFile)) {
    return fs.readFileSync(wsFile, 'utf-8');
  }

  // 2. Check global
  const globalSkillsDir = path.join(os.homedir(), '.config', 'jpa-cli', 'skills');
  const glFile = path.join(globalSkillsDir, name, 'SKILL.md');
  if (fs.existsSync(glFile)) {
    return fs.readFileSync(glFile, 'utf-8');
  }

  // 3. Check bundled skills directory
  let skillsDir = path.join(__dirname, '..', '..', 'skills');
  if ((process as any).pkg) {
    skillsDir = path.join(__dirname, '..', 'skills');
  } else if (!fs.existsSync(skillsDir)) {
    skillsDir = path.join(__dirname, '..', 'skills');
  }
  
  const normalizedFolderName = name.replace(/\//g, '-');
  const bundledFile = path.join(skillsDir, normalizedFolderName, 'SKILL.md');
  if (fs.existsSync(bundledFile)) {
    return fs.readFileSync(bundledFile, 'utf-8');
  }

  return null;
}

