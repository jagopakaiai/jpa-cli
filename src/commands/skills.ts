import fs from 'fs';
import path from 'path';
import os from 'os';
import * as p from '@clack/prompts';
import { getApiKey } from '../utils/config.js';
import { fetchSkillRule } from '../utils/api.js';
import { detectWorkspace } from '../utils/detector.js';
import { syncCommand } from './sync.js';
import { parseSkillFile, generateSkillTemplate } from '../utils/skills-parser.js';

interface SkillInfo {
  name: string;
  description: string;
  scope: 'Workspace' | 'Global' | 'Remote';
  filePath?: string;
}

const REMOTE_CATALOG: SkillInfo[] = [
  { name: 'laravel-clean-api', description: 'Laravel coding standards for modular, clean controllers and repositories', scope: 'Remote' },
  { name: 'typescript-esm', description: 'Strict TypeScript configuration with native ESM import resolutions', scope: 'Remote' },
  { name: 'python-data-science', description: 'Data Science stack settings for pandas, numpy, and Jupyter notebook optimizations', scope: 'Remote' },
  { name: 'generic-clean-code', description: 'General software engineering guidelines focusing on DRY, SOLID, and TDD', scope: 'Remote' },
  { name: 'google-gemini-api-dev', description: 'Developing GenAI integrations using Google Gemini API and Vertex AI SDKs', scope: 'Remote' },
  { name: 'supabase-postgres-best-practices', description: 'PostgreSQL schema design, constraints, and indexing standards for Supabase', scope: 'Remote' },
  { name: 'stripe-best-practices', description: 'Building secure, idempotent payment workflows and webhooks integrations with Stripe', scope: 'Remote' },
  { name: 'cloudflare-workers-dev', description: 'Deploying optimized serverless endpoints and edge caching using Cloudflare Workers', scope: 'Remote' },
  { name: 'vercel-nextjs-optimization', description: 'Next.js rendering optimization (SSR/SSG), routing layout patterns, and core web vitals', scope: 'Remote' }
];

const GLOBAL_SKILLS_DIR = path.join(os.homedir(), '.config', 'jagopakaiai-cli', 'skills');

export async function skillsListCommand() {
  p.intro('JagoPakaiAI Skills Manager');

  // Discover skills
  const discovered: SkillInfo[] = [];

  // 1. Workspace-scoped skills (.agents/skills/*)
  const currentDir = process.cwd();
  const workspaceSkillsDir = path.join(currentDir, '.agents', 'skills');
  if (fs.existsSync(workspaceSkillsDir)) {
    try {
      const dirs = fs.readdirSync(workspaceSkillsDir);
      for (const dirName of dirs) {
        const file = path.join(workspaceSkillsDir, dirName, 'SKILL.md');
        if (fs.existsSync(file)) {
          const parsed = parseSkillFile(file);
          if (parsed.isValid) {
            discovered.push({
              name: parsed.metadata.name,
              description: parsed.metadata.description,
              scope: 'Workspace',
              filePath: file
            });
          }
        }
      }
    } catch {}
  }

  // 2. Global-scoped skills (~/.config/jagopakaiai-cli/skills/*)
  if (fs.existsSync(GLOBAL_SKILLS_DIR)) {
    try {
      const dirs = fs.readdirSync(GLOBAL_SKILLS_DIR);
      for (const dirName of dirs) {
        const file = path.join(GLOBAL_SKILLS_DIR, dirName, 'SKILL.md');
        if (fs.existsSync(file)) {
          const parsed = parseSkillFile(file);
          if (parsed.isValid) {
            discovered.push({
              name: parsed.metadata.name,
              description: parsed.metadata.description,
              scope: 'Global',
              filePath: file
            });
          }
        }
      }
    } catch {}
  }

  // 3. Remote catalog
  discovered.push(...REMOTE_CATALOG);

  // Present skills list
  const listRows = discovered.map((s, idx) => {
    return `${idx + 1}. [${s.scope}] ${s.name}\n   Description: ${s.description}`;
  }).join('\n\n');

  p.note(listRows || 'No skills discovered.', 'Discovered Skills (ATM Model)');

  // Main menu choices
  const action = await p.select({
    message: 'Select action to perform:',
    options: [
      { value: 'sync', label: '🔄 Synchronize rules for a remote skill' },
      { value: 'create', label: '🆕 Create/Scaffold a new custom skill' },
      { value: 'validate', label: '🔍 Validate a skill markdown file' },
      { value: 'back', label: '🔙 Return' }
    ]
  });

  if (p.isCancel(action) || action === 'back') {
    p.outro('Exited skills manager.');
    return;
  }

  if (action === 'sync') {
    const choices = REMOTE_CATALOG.map(s => ({ value: s.name, label: s.name }));
    const selectSkill = await p.select({
      message: 'Select a skill to sync:',
      options: choices
    });

    if (!p.isCancel(selectSkill)) {
      await syncCommand(selectSkill as string);
    }
  } else if (action === 'create') {
    await skillsCreateCommand();
  } else if (action === 'validate') {
    await skillsValidateCommand();
  }

  p.outro('Skills operation complete!');
}

export async function skillsCreateCommand() {
  p.intro('Create New Skill Template');

  const name = await p.text({
    message: 'Enter the skill name slug (lowercase-dash):',
    placeholder: 'my-custom-validator',
    validate: (value) => {
      if (!value || value.trim().length === 0) return 'Skill name is required!';
      if (!/^[a-z0-9-]+$/.test(value)) return 'Skill name must contain only lowercase letters, numbers, and dashes.';
    }
  });
  if (p.isCancel(name)) return;

  const description = await p.text({
    message: 'Enter the skill description:',
    placeholder: 'Best practice instructions for validating input models',
    validate: (value) => {
      if (!value || value.trim().length === 0) return 'Description is required!';
    }
  });
  if (p.isCancel(description)) return;

  const targetScope = await p.select({
    message: 'Select target directory scope:',
    options: [
      { value: 'workspace', label: 'Workspace-scoped (.agents/skills/)' },
      { value: 'global', label: 'Global-scoped (~/.config/jagopakaiai-cli/skills/)' }
    ]
  });
  if (p.isCancel(targetScope)) return;

  const targetDir = targetScope === 'workspace' 
    ? path.join(process.cwd(), '.agents', 'skills', name)
    : path.join(GLOBAL_SKILLS_DIR, name);

  const file = path.join(targetDir, 'SKILL.md');

  const s = p.spinner();
  s.start('Writing skill template...');
  try {
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    const content = generateSkillTemplate(name, description);
    fs.writeFileSync(file, content);
    s.stop('Skill created successfully!');
    p.log.success(`Scaffolded skill at: ${file}`);
  } catch (err: any) {
    s.stop('Write failed!');
    p.log.error(err.message || String(err));
  }
}

export async function skillsValidateCommand() {
  p.intro('Validate Skill File');

  const filePathInput = await p.text({
    message: 'Enter absolute or relative path to SKILL.md file:',
    placeholder: './.agents/skills/my-skill/SKILL.md',
    validate: (value) => {
      if (!value || value.trim().length === 0) return 'Path is required!';
    }
  });
  if (p.isCancel(filePathInput)) return;

  const fullPath = path.resolve(process.cwd(), filePathInput as string);

  const s = p.spinner();
  s.start('Validating file...');
  const result = parseSkillFile(fullPath);
  s.stop('Validation scan completed!');

  if (result.isValid) {
    p.log.success('The skill file structure is VALID!');
    p.note([
      `Name: ${result.metadata.name}`,
      `Description: ${result.metadata.description}`,
      `Instruction length: ${result.body.length} characters`
    ].join('\n'), 'Parsed Metadata');
  } else {
    p.log.error('The skill file structure is INVALID!');
    p.note(result.errors.join('\n'), 'Validation Errors');
  }
}
