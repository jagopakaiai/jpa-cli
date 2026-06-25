import fs from 'fs';
import path from 'path';
import * as p from '@clack/prompts';
import { getApiKey } from '../utils/config.js';
import { detectWorkspace } from '../utils/detector.js';
import { fetchSkillRule } from '../utils/api.js';

export async function syncCommand(skillName: string | undefined) {
  p.intro('JagoPakaiAI Config Synchronizer');

  const apiKey = getApiKey();
  if (!apiKey) {
    p.log.error('Authentication required! Please run "jagopakaiai-cli login" first.');
    process.exit(1);
  }

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
    ruleContent = await fetchSkillRule(apiKey, skillName);
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
    fs.writeFileSync(fullPath, ruleContent);
    p.log.success(`Synchronized: ${target}`);
  }
  writeSpinner.stop('Writing complete!');

  p.outro('Synchronization successfully completed!');
}
