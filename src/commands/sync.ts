import fs from 'fs';
import path from 'path';
import * as p from '@clack/prompts';
import { getApiKey } from '../utils/config.js';
import { fetchRawSkillFromUrl, fetchSkillRule } from '../utils/api.js';
import { detectWorkspace } from '../utils/detector.js';
import { whiteLabelSkillContent } from '../utils/skills-parser.js';

export async function syncCommand(skillName: string | undefined, url?: string) {
  p.intro('JagoPakaiAI Config Synchronizer');

  if (!skillName) {
    const inputSkill = await p.text({
      message: 'Enter the skill name to sync (e.g. laravel-api-clean):',
      validate: (value) => {
        if (!value || value.trim().length === 0) return 'Skill name is required!';
      }
    });
    if (p.isCancel(inputSkill)) {
      p.cancel('Sync cancelled.');
      process.exit(0);
    }
    skillName = inputSkill as string;
  }

  const currentDir = process.cwd();
  const env = detectWorkspace(currentDir);

  const availableConfigs = [];
  if (env.cursor) availableConfigs.push({ value: '.cursorrules', label: 'Cursor Rules (.cursorrules)' });
  if (env.claude) availableConfigs.push({ value: '.claudecoderc', label: 'Claude Code (.claudecoderc)' });
  if (env.copilot) availableConfigs.push({ value: '.github/copilot-instructions.md', label: 'GitHub Copilot (.github/copilot-instructions.md)' });

  // Fallbacks if nothing detected
  if (availableConfigs.length === 0) {
    availableConfigs.push(
      { value: '.cursorrules', label: 'Cursor Rules (.cursorrules)' },
      { value: '.claudecoderc', label: 'Claude Code (.claudecoderc)' },
      { value: '.github/copilot-instructions.md', label: 'GitHub Copilot (.github/copilot-instructions.md)' }
    );
  }

  let selectedTargets: string[] = [];
  if (availableConfigs.length === 1) {
    selectedTargets = [availableConfigs[0].value];
  } else {
    const selection = await p.multiselect({
      message: 'Select AI rule configs to write to:',
      options: availableConfigs,
      required: true
    });
    if (p.isCancel(selection)) {
      p.cancel('Sync cancelled.');
      process.exit(0);
    }
    selectedTargets = selection as string[];
  }

  const s = p.spinner();
  s.start(`Fetching skill "${skillName}" rules...`);
  let ruleContent = '';
  try {
    if (url) {
      const rawContent = await fetchRawSkillFromUrl(url);
      ruleContent = whiteLabelSkillContent(rawContent, skillName);
    } else {
      const apiKey = getApiKey();
      if (!apiKey) {
        throw new Error('Authentication required to sync remote API skills. Run "jagopakaiai-cli login" first.');
      }
      const rawContent = await fetchSkillRule(apiKey, skillName);
      ruleContent = whiteLabelSkillContent(rawContent, skillName);
    }
    s.stop(`Successfully fetched "${skillName}" rules!`);
  } catch (err: any) {
    s.stop('Fetch failed!');
    p.log.error(err.message || String(err));
    process.exit(1);
  }

  const writeSpinner = p.spinner();
  writeSpinner.start('Writing rule configurations to files...');
  for (const target of selectedTargets) {
    const fullPath = path.join(currentDir, target);
    const parentDir = path.dirname(fullPath);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }
    
    // Format rule block nicely
    const blockContent = [
      `# JagoPakaiAI Integrated Skill Rules: ${skillName}`,
      ruleContent
    ].join('\n\n');
    
    fs.writeFileSync(fullPath, blockContent);
    p.log.success(`Synchronized: ${target}`);
  }
  writeSpinner.stop('Writing complete!');

  p.outro('Synchronization successfully completed!');
}
