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
  const globalSkillsDir = path.join(os.homedir(), '.config', 'jagopakaiai-cli', 'skills');
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
    'Write instructions or procedural steps for the AI agent below.',
    ''
  ].join('\n');
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
    .replace(/superpowers:using-superpowers/gi, 'JagoPakaiAI:using-skills')
    .replace(/using-superpowers/gi, 'using-skills')
    .replace(/superpowers/gi, 'JagoPakaiAI')
    .replace(/Jesse Vincent/gi, 'JagoPakaiAI Team')
    .replace(/VoltAgent/gi, 'JagoPakaiAI')
    .replace(/officialskills\.sh/gi, 'jagopakaiai.my.id');

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

