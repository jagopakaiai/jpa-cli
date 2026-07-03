import fs from 'fs';
import path from 'path';
import os from 'os';
import * as p from '@clack/prompts';
import pc from 'picocolors';
import { getApiKey } from '../utils/config.js';
import { detectWorkspace } from '../utils/detector.js';
import { syncCommand } from './sync.js';
import { 
  parseSkillFile, 
  generateSkillTemplate, 
  isWorkspaceSkillInstalled, 
  isGlobalSkillInstalled, 
  isSkillSynced,
  parseAwesomeAgentSkills,
  whiteLabelSkillContent,
  getLocalSkillContent
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

const GLOBAL_SKILLS_DIR = path.join(os.homedir(), '.config', 'jpa-cli', 'skills');

export async function skillsListCommand() {
  p.intro('JPA CLI Skills Manager');

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

  // 2. Global-scoped skills (~/.config/jpa-cli/skills/*)
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
      { value: 'install_global', label: '🌍 Save/Install globally to home directory (~/.config/jpa-cli/skills/)' },
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

    // Get content from local if exists, else bundled, else fallback
    let content = getLocalSkillContent(sInfo.name);
    if (!content) {
      p.log.warn(`Skill "${sInfo.name}" not found in local workspace or catalog. Generating template...`);
      content = generateSkillTemplate(sInfo.name, sInfo.description);
    } else {
      content = whiteLabelSkillContent(content, sInfo.name, sInfo.description);
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
  p.intro('JPA CLI Skill Creator — Multi-Step Wizard');

  // ─── Step 1: Archetype / Category ──────────────────────────
  const category = await p.select({
    message: 'Step 1/6 — Choose skill category / archetype:',
    options: [
      { value: 'coding', label: '💻 Coding Standards — language/framework conventions' },
      { value: 'workflow', label: '🔄 Workflow — step-by-step development process' },
      { value: 'debugging', label: '🔍 Debugging — root cause analysis & fix patterns' },
      { value: 'architecture', label: '🏗️ Architecture — design patterns & structure' },
      { value: 'testing', label: '🧪 Testing — testing methodology & coverage' },
      { value: 'security', label: '🔒 Security — secure coding & audit' },
      { value: 'docs', label: '📖 Documentation — writing docs & comments' },
      { value: 'custom', label: '⭐ Custom / Blank — start from scratch' }
    ]
  });
  if (p.isCancel(category)) return;

  // ─── Step 2: Clone from existing? ──────────────────────────
  let cloneSource: string | null = null;
  const shouldClone = await p.confirm({
    message: 'Clone from an existing installed skill as base?',
    initialValue: false
  });
  if (p.isCancel(shouldClone)) return;

  if (shouldClone) {
    const candidates: { label: string; value: string }[] = [];
    const wsDir = path.join(process.cwd(), '.agents', 'skills');
    const glDir = GLOBAL_SKILLS_DIR;

    for (const dir of [wsDir, glDir]) {
      if (fs.existsSync(dir)) {
        for (const d of fs.readdirSync(dir)) {
          const skillFile = path.join(dir, d, 'SKILL.md');
          if (fs.existsSync(skillFile)) {
            const parsed = parseSkillFile(skillFile);
            if (parsed.isValid) {
              candidates.push({
                value: skillFile,
                label: `${parsed.metadata.name} — ${parsed.metadata.description.substring(0, 50)}`
              });
            }
          }
        }
      }
    }

    if (candidates.length === 0) {
      p.log.warn('No existing skills found to clone from.');
    } else {
      const chosen = await p.select({
        message: 'Select skill to clone:',
        options: candidates
      });
      if (!p.isCancel(chosen)) {
        cloneSource = chosen as string;
      }
    }
  }

  // ─── Step 3: Basic Info ─────────────────────────────────────
  p.log.info('Step 2/6 — Basic Information');

  const name = await p.text({
    message: 'Skill name slug (lowercase-dash):',
    placeholder: 'my-custom-validator',
    validate: (value) => {
      if (!value || value.trim().length === 0) return 'Required!';
      if (!/^[a-z0-9-]+$/.test(value)) return 'Only lowercase letters, numbers, and dashes.';
    }
  });
  if (p.isCancel(name)) return;

  const description = await p.text({
    message: 'Short description (one line):',
    placeholder: 'Validates input models with strict typing rules',
    validate: (value) => {
      if (!value || value.trim().length === 0) return 'Required!';
    }
  });
  if (p.isCancel(description)) return;

  // ─── Step 4: Triggers ───────────────────────────────────────
  p.log.info('Step 3/6 — When should this skill activate? (triggers)');

  const triggers: string[] = [];
  let addTrigger = true;
  while (addTrigger) {
    const trigger = await p.text({
      message: `Trigger ${triggers.length + 1} (leave empty to finish):`,
      placeholder: 'When user asks to refactor a function' 
    });
    if (p.isCancel(trigger)) return;
    if (!trigger || (trigger as string).trim().length === 0) {
      addTrigger = false;
    } else {
      triggers.push(trigger as string);
    }
  }
  if (triggers.length === 0) {
    triggers.push('When the skill context matches');
  }

  // ─── Step 5: Workflow Steps ─────────────────────────────────
  p.log.info('Step 4/6 — Define the workflow steps');

  const workflowSteps: string[] = [];
  let addStep = true;
  while (addStep) {
    const step = await p.text({
      message: `Step ${workflowSteps.length + 1} (leave empty to finish):`,
      placeholder: 'Analyze the code structure first'
    });
    if (p.isCancel(step)) return;
    if (!step || (step as string).trim().length === 0) {
      addStep = false;
    } else {
      workflowSteps.push(step as string);
    }
  }
  if (workflowSteps.length === 0) {
    workflowSteps.push('Understand the context', 'Execute the task', 'Verify the result');
  }

  // ─── Step 6: Instructions ───────────────────────────────────
  p.log.info('Step 5/6 — Add specific instructions (rules for the AI)');

  const instructions: string[] = [];
  let addInstruction = true;
  while (addInstruction) {
    const instruction = await p.text({
      message: `Instruction ${instructions.length + 1} (leave empty to finish):`,
      placeholder: 'Always validate input types before processing'
    });
    if (p.isCancel(instruction)) return;
    if (!instruction || (instruction as string).trim().length === 0) {
      addInstruction = false;
    } else {
      instructions.push(instruction as string);
    }
  }
  if (instructions.length === 0) {
    instructions.push('Follow project conventions');
  }

  // ─── Step 7: Tools ──────────────────────────────────────────
  p.log.info('Step 6/6 — Required tools / resources');

  const tools: string[] = [];
  let addTool = true;
  while (addTool) {
    const tool = await p.text({
      message: `Tool/resource ${tools.length + 1} (leave empty to finish):`,
      placeholder: 'MCP: filesystem — to read project files'
    });
    if (p.isCancel(tool)) return;
    if (!tool || (tool as string).trim().length === 0) {
      addTool = false;
    } else {
      tools.push(tool as string);
    }
  }

  // ─── Preview ────────────────────────────────────────────────
  const { generateRichSkillContent } = await import('../utils/skills-parser.js');
  let finalContent: string;

  if (cloneSource && fs.existsSync(cloneSource)) {
    const existing = fs.readFileSync(cloneSource, 'utf-8');
    finalContent = existing
      .replace(/^name:.*$/m, `name: ${name}`)
      .replace(/^description:.*$/m, `description: "${description}"`);
    p.log.info('Based on cloned skill with updated metadata.');
  } else {
    finalContent = generateRichSkillContent({
      name: name as string,
      description: description as string,
      category: category as string,
      triggers,
      workflow: workflowSteps,
      instructions,
      tools
    });
  }

  p.note(finalContent.length > 1000 ? finalContent.substring(0, 1000) + '\n\n...' : finalContent, '📝 Preview');

  // ─── Target Scope ───────────────────────────────────────────
  const targetScope = await p.select({
    message: 'Save to:',
    options: [
      { value: 'workspace', label: '📁 Workspace (.agents/skills/)' },
      { value: 'global', label: '🌍 Global (~/.config/jpa-cli/skills/)' }
    ]
  });
  if (p.isCancel(targetScope)) return;

  const targetDir = targetScope === 'workspace'
    ? path.join(process.cwd(), '.agents', 'skills', name as string)
    : path.join(GLOBAL_SKILLS_DIR, name as string);

  const file = path.join(targetDir, 'SKILL.md');

  // ─── Confirm & Write ────────────────────────────────────────
  const confirm = await p.confirm({
    message: 'Create this skill?',
    initialValue: true
  });
  if (p.isCancel(confirm) || !confirm) {
    p.cancel('Skill creation cancelled.');
    return;
  }

  const s = p.spinner();
  s.start('Writing skill file...');
  try {
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    fs.writeFileSync(file, finalContent);
    s.stop('Skill created successfully!');
    p.log.success(`Saved: ${file}`);

    // Auto-validate
    const result = parseSkillFile(file);
    if (result.isValid) {
      p.log.success('✅ Validation passed — frontmatter and structure valid.');
    } else {
      p.log.warn('⚠️  File saved but validation found issues:');
      result.errors.forEach(e => p.log.warn(`  - ${e}`));
    }
  } catch (err: any) {
    s.stop('Write failed!');
    p.log.error(err.message || String(err));
  }

  // ─── Next Steps ─────────────────────────────────────────────
  p.outro('What to do next:');
  p.log.info(`  • Edit:         ${file}`);
  p.log.info(`  • Validate:     jpa-cli skills validate ${file}`);
  p.log.info(`  • Sync to editor: jpa-cli sync ${name}`);
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

export async function skillsSearchCommand(query: string) {
  const discoveredMap = new Map<string, SkillInfo>();

  const currentDir = process.cwd();
  const workspaceSkillsDir = path.join(currentDir, '.agents', 'skills');
  if (fs.existsSync(workspaceSkillsDir)) {
    try {
      for (const dirName of fs.readdirSync(workspaceSkillsDir)) {
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
          }
        }
      }
    } catch {}
  }

  if (fs.existsSync(GLOBAL_SKILLS_DIR)) {
    try {
      for (const dirName of fs.readdirSync(GLOBAL_SKILLS_DIR)) {
        const file = path.join(GLOBAL_SKILLS_DIR, dirName, 'SKILL.md');
        if (fs.existsSync(file)) {
          const parsed = parseSkillFile(file);
          if (parsed.isValid && !discoveredMap.has(parsed.metadata.name)) {
            discoveredMap.set(parsed.metadata.name, {
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

  for (const s of RECOMMENDED_SKILLS) {
    if (!discoveredMap.has(s.name)) {
      discoveredMap.set(s.name, s);
    }
  }

  const keyword = query.toLowerCase();
  const results = Array.from(discoveredMap.values()).filter(s =>
    s.name.toLowerCase().includes(keyword) ||
    s.description.toLowerCase().includes(keyword)
  );

  p.intro(`Search Results for "${query}"`);
  if (results.length === 0) {
    p.log.warn(`No skills matched "${query}".`);
    p.outro('Try a different keyword.');
    return;
  }

  const rows = results.map((s, i) => {
    const scopeIcon = s.scope === 'Workspace' ? '📁' : s.scope === 'Global' ? '🌍' : '☁️';
    return `${i + 1}. ${scopeIcon} ${pc.bold(s.name)}\n   ${s.description}`;
  }).join('\n\n');

  p.note(rows, `Found ${results.length} skill(s)`);

  const select = await p.select({
    message: 'Select a skill to manage:',
    options: [
      ...results.map(s => ({ value: s.name, label: `${s.name} — ${s.description.substring(0, 40)}` })),
      { value: 'back', label: '🔙 Back' }
    ]
  });

  if (!p.isCancel(select) && select !== 'back') {
    const sInfo = results.find(s => s.name === select)!;
    await manageSkillMenu(sInfo);
  }
  p.outro('Search complete.');
}
