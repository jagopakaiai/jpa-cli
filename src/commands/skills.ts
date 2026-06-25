import fs from 'fs';
import path from 'path';
import os from 'os';
import * as p from '@clack/prompts';
import { getApiKey } from '../utils/config.js';
import { fetchRawSkillFromUrl, fetchSkillRule } from '../utils/api.js';
import { detectWorkspace } from '../utils/detector.js';
import { syncCommand } from './sync.js';
import { 
  parseSkillFile, 
  generateSkillTemplate, 
  isWorkspaceSkillInstalled, 
  isGlobalSkillInstalled, 
  isSkillSynced,
  parseAwesomeAgentSkills,
  whiteLabelSkillContent
} from '../utils/skills-parser.js';

interface SkillInfo {
  name: string;
  description: string;
  scope: 'Workspace' | 'Global' | 'Remote';
  filePath?: string;
  url?: string;
}

const RECOMMENDED_SKILLS: SkillInfo[] = [
  { name: 'brainstorming', description: 'Brainstorm intent and design choices before implementation', scope: 'Remote' },
  { name: 'subagent-development', description: 'Run subagent tasks systematically with plan isolation', scope: 'Remote' },
  { name: 'tdd-methodology', description: 'Strict Test-Driven Development (TDD) execution guidelines', scope: 'Remote' },
  { name: 'systematic-debugging', description: 'Root cause analysis and debugging process before fixing bugs', scope: 'Remote' },
  { name: 'verification-workflow', description: 'Pre-flight checks and verification steps before completion', scope: 'Remote' },
  { name: 'plan-writing', description: 'Writing structured and reviewable task implementation plans', scope: 'Remote' },
  { name: 'skill-authoring', description: 'Scaffolding, validating, and registering custom agent skills', scope: 'Remote' },
  { name: 'git-worktrees', description: 'Isolating concurrent tasks using Git worktrees safely', scope: 'Remote' },
  { name: 'laravel-clean-api', description: 'Laravel coding standards for modular, clean controllers and repositories', scope: 'Remote' },
  { name: 'typescript-esm', description: 'Strict TypeScript configuration with native ESM import resolutions', scope: 'Remote' },
  { name: 'python-data-science', description: 'Data Science stack settings for pandas, numpy, and Jupyter notebook optimizations', scope: 'Remote' },
  { name: 'generic-clean-code', description: 'General software engineering guidelines focusing on DRY, SOLID, and TDD', scope: 'Remote' }
];

const GLOBAL_SKILLS_DIR = path.join(os.homedir(), '.config', 'jagopakaiai-cli', 'skills');

export async function skillsListCommand() {
  p.intro('JagoPakaiAI Skills Manager');

  // Discover skills
  const discoveredMap = new Map<string, SkillInfo>();

  // 1. Workspace-scoped skills (.agents/skills/*)
  const currentDir = process.cwd();
  const workspaceSkillsDir = path.join(currentDir, '.agents', 'skills');
  let workspaceCount = 0;
  if (fs.existsSync(workspaceSkillsDir)) {
    try {
      const dirs = fs.readdirSync(workspaceSkillsDir);
      for (const dirName of dirs) {
        const file = path.join(workspaceSkillsDir, dirName, 'SKILL.md');
        if (fs.existsSync(file)) {
          const parsed = parseSkillFile(file);
          if (parsed.isValid) {
            discoveredMap.set(parsed.metadata.name, {
              name: parsed.metadata.name,
              description: parsed.metadata.description,
              scope: 'Workspace',
              filePath: file
            });
            workspaceCount++;
          }
        }
      }
    } catch {}
  }

  // 2. Global-scoped skills (~/.config/jagopakaiai-cli/skills/*)
  let globalCount = 0;
  if (fs.existsSync(GLOBAL_SKILLS_DIR)) {
    try {
      const dirs = fs.readdirSync(GLOBAL_SKILLS_DIR);
      for (const dirName of dirs) {
        const file = path.join(GLOBAL_SKILLS_DIR, dirName, 'SKILL.md');
        if (fs.existsSync(file)) {
          const parsed = parseSkillFile(file);
          if (parsed.isValid) {
            if (!discoveredMap.has(parsed.metadata.name)) {
              discoveredMap.set(parsed.metadata.name, {
                name: parsed.metadata.name,
                description: parsed.metadata.description,
                scope: 'Global',
                filePath: file
              });
              globalCount++;
            }
          }
        }
      }
    } catch {}
  }

  // 3. Recommended catalog
  for (const s of RECOMMENDED_SKILLS) {
    if (!discoveredMap.has(s.name)) {
      discoveredMap.set(s.name, s);
    }
  }

  // 4. Curated skills from playground (awesome-agent-skills README.md)
  let playgroundCount = 0;
  const playgroundReadme = path.join(currentDir, 'playground', 'awesome-agent-skills', 'README.md');
  if (fs.existsSync(playgroundReadme)) {
    try {
      const curated = parseAwesomeAgentSkills(playgroundReadme);
      for (const cs of curated) {
        if (!discoveredMap.has(cs.name)) {
          discoveredMap.set(cs.name, {
            name: cs.name,
            description: cs.description,
            scope: 'Remote',
            url: cs.url
          });
          playgroundCount++;
        }
      }
    } catch {}
  }

  const discovered = Array.from(discoveredMap.values());

  // Display status summary
  const summaryLines = [
    `● Workspace Scope: ${workspaceCount} active skills`,
    `● Global Scope: ${globalCount} active skills`,
    playgroundCount > 0 ? `● Curated (Playground): ${playgroundCount} skills loaded` : '○ Playground: awesome-agent-skills not found in playground/'
  ].join('\n');

  p.note(summaryLines, 'Active Skills Environment');

  // Main menu choices
  const action = await p.select({
    message: 'Select action to perform:',
    options: [
      { value: 'search', label: '🔍 Search for a skill by name/keyword' },
      { value: 'browse_local', label: '💻 Browse active local workspace skills' },
      { value: 'browse_all', label: '📚 Browse full catalog' },
      { value: 'create', label: '🆕 Create / Scaffold a new custom skill' },
      { value: 'validate', label: '🔍 Validate a local SKILL.md file' },
      { value: 'back', label: '🔙 Return' }
    ]
  });

  if (p.isCancel(action) || action === 'back') {
    p.outro('Exited skills manager.');
    return;
  }

  let skillsSubset: SkillInfo[] = [];

  if (action === 'search') {
    const searchVal = await p.text({
      message: 'Enter search keyword (e.g. git, postgres, angular):',
      validate: (val) => {
        if (!val || val.trim().length === 0) return 'Keyword is required!';
      }
    });
    if (p.isCancel(searchVal)) {
      p.outro('Cancelled.');
      return;
    }
    const keyword = (searchVal as string).toLowerCase();
    skillsSubset = discovered.filter(s => 
      s.name.toLowerCase().includes(keyword) || 
      s.description.toLowerCase().includes(keyword)
    );
    if (skillsSubset.length === 0) {
      p.log.warn(`No skills matched keyword: "${keyword}"`);
      return;
    }
  } else if (action === 'browse_local') {
    skillsSubset = discovered.filter(s => s.scope === 'Workspace' || s.scope === 'Global');
    if (skillsSubset.length === 0) {
      p.log.warn('No active workspace or global skills found.');
      return;
    }
  } else if (action === 'browse_all') {
    skillsSubset = discovered;
  } else if (action === 'create') {
    await skillsCreateCommand();
    return;
  } else if (action === 'validate') {
    await skillsValidateCommand();
    return;
  }

  // Manage selection from subset
  const choices = skillsSubset.map(s => {
    const isW = isWorkspaceSkillInstalled(s.name);
    const isG = isGlobalSkillInstalled(s.name);
    const loc = isW ? '(Workspace)' : isG ? '(Global)' : '(Remote)';
    return { value: s.name, label: `${s.name} ${loc}` };
  });

  // Limit selection view count for very large lists
  const selectSkill = await p.select({
    message: `Select a skill to manage (${choices.length} found):`,
    options: choices
  });

  if (p.isCancel(selectSkill)) {
    p.outro('Skills operation cancelled.');
    return;
  }

  const selectedSkillName = selectSkill as string;
  const sInfo = discovered.find(s => s.name === selectedSkillName)!;

  await manageSkillMenu(sInfo);
  p.outro('Skills operation complete!');
}

async function manageSkillMenu(sInfo: SkillInfo) {
  const isW = isWorkspaceSkillInstalled(sInfo.name);
  const isG = isGlobalSkillInstalled(sInfo.name);
  const isS = isSkillSynced(sInfo.name);

  p.note(
    `Skill: ${sInfo.name}\n` +
    `Description: ${sInfo.description}\n` +
    `Scope: ${isW ? 'Workspace-installed' : isG ? 'Global-installed' : 'Remote (Uninstalled)'}\n` +
    `Sync status: ${isS ? 'Rules synchronized in project config' : 'Rules not synchronized'}\n` +
    (sInfo.filePath ? `File Path: ${sInfo.filePath}` : '') +
    (sInfo.url ? `Source URL: ${sInfo.url}` : ''),
    'Skill Status Information'
  );

  const subAction = await p.select({
    message: `What would you like to do with "${sInfo.name}"?`,
    options: [
      { value: 'sync', label: '🔄 Synchronize rules to project editor configs' },
      { value: 'install_workspace', label: '💻 Save/Install locally to workspace (.agents/skills/)' },
      { value: 'install_global', label: '🌍 Save/Install globally to home directory (~/.config/)' },
      ...(isW || isG ? [{ value: 'validate', label: '🔍 Validate local file integrity' }] : []),
      { value: 'back', label: '🔙 Back' }
    ]
  });

  if (p.isCancel(subAction) || subAction === 'back') {
    return;
  }

  if (subAction === 'sync') {
    await syncCommand(sInfo.name, sInfo.url);
  } else if (subAction === 'install_workspace' || subAction === 'install_global') {
    const scope = subAction === 'install_workspace' ? 'workspace' : 'global';
    const targetDir = scope === 'workspace' 
      ? path.join(process.cwd(), '.agents', 'skills', sInfo.name)
      : path.join(GLOBAL_SKILLS_DIR, sInfo.name);
    
    const file = path.join(targetDir, 'SKILL.md');

    // Get content from local if exists, else remote
    let content = '';
    if (sInfo.filePath && fs.existsSync(sInfo.filePath)) {
      content = fs.readFileSync(sInfo.filePath, 'utf-8');
    } else if (sInfo.url) {
      const fetchSpinner = p.spinner();
      fetchSpinner.start(`Downloading skill from ${sInfo.url}...`);
      try {
        const rawContent = await fetchRawSkillFromUrl(sInfo.url);
        fetchSpinner.stop('Downloaded successfully!');
        content = rawContent;
        // White-labeling content in case it has references to original sources
        content = whiteLabelSkillContent(content, sInfo.name, sInfo.description);
      } catch (err: any) {
        fetchSpinner.stop('Download failed!');
        p.log.error(`Error resolving URL: ${err.message || String(err)}`);
        content = generateSkillTemplate(sInfo.name, sInfo.description);
      }
    } else {
      const apiKey = getApiKey();
      if (!apiKey) {
        p.log.warn('Authentication required to download remote skills. Running login flow or fallback template...');
        content = generateSkillTemplate(sInfo.name, sInfo.description);
      } else {
        const fetchSpinner = p.spinner();
        fetchSpinner.start(`Fetching skill "${sInfo.name}" rules from API...`);
        try {
          const apiRules = await fetchSkillRule(apiKey, sInfo.name);
          fetchSpinner.stop('Fetched successfully!');
          content = apiRules;
          content = whiteLabelSkillContent(content, sInfo.name, sInfo.description);
        } catch (err: any) {
          fetchSpinner.stop('Fetch failed!');
          p.log.error(`API Error: ${err.message || String(err)}`);
          content = generateSkillTemplate(sInfo.name, sInfo.description);
        }
      }
    }

    const s = p.spinner();
    s.start(`Writing skill files to ${scope} folder...`);
    try {
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      fs.writeFileSync(file, content);
      s.stop(`Successfully installed skill ${sInfo.name}!`);
      p.log.success(`File saved: ${file}`);
    } catch (err: any) {
      s.stop('Write failed!');
      p.log.error(err.message || String(err));
    }
  } else if (subAction === 'validate') {
    if (sInfo.filePath) {
      const s = p.spinner();
      s.start('Validating file integrity...');
      const result = parseSkillFile(sInfo.filePath);
      s.stop('Validation scan completed!');
      if (result.isValid) {
        p.log.success('The skill file structure is VALID!');
      } else {
        p.log.error('The skill file structure is INVALID!');
        p.note(result.errors.join('\n'), 'Validation Errors');
      }
    }
  }
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
