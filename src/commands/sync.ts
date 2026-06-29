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
      return;
    }
    skillName = inputSkill as string;
  }

  const currentDir = process.cwd();
  const env = detectWorkspace(currentDir);

  const availableConfigs = [];
  if (env.cursor) availableConfigs.push({ value: '.cursorrules', label: 'Cursor Rules (.cursorrules)' });
  if (env.cursorDir) availableConfigs.push({ value: '.cursor/rules/jagopakaiai.md', label: 'Cursor Rules Dir (.cursor/rules/)' });
  if (env.claude) availableConfigs.push({ value: '.claudecoderc', label: 'Claude Code (.claudecoderc)' });
  if (env.claudeMd) availableConfigs.push({ value: 'CLAUDE.md', label: 'Claude MD (CLAUDE.md)' });
  if (env.copilot) availableConfigs.push({ value: '.github/copilot-instructions.md', label: 'GitHub Copilot (.github/copilot-instructions.md)' });
  if (env.agentsMd) availableConfigs.push({ value: 'AGENTS.md', label: 'Agents MD (AGENTS.md) - Gemini/Antigravity/Pi' });
  if (env.aiderRules) availableConfigs.push({ value: '.aider.instructions.md', label: 'Aider Rules (.aider.instructions.md)' });
  if (env.traerules) availableConfigs.push({ value: '.traerules', label: 'Trae Rules (.traerules)' });
  if (env.devinDir) availableConfigs.push({ value: '.devin/instructions.md', label: 'Devin Rules (.devin/instructions.md)' });
  if (env.codebuddyrc) availableConfigs.push({ value: '.codebuddyrc', label: 'CodeBuddy Config (.codebuddyrc)' });
  if (env.codexrules) availableConfigs.push({ value: '.codexrules', label: 'Codex Rules (.codexrules)' });
  if (env.opencoderules) availableConfigs.push({ value: '.opencoderules', label: 'OpenCode Rules (.opencoderules)' });
  if (env.kilorules) availableConfigs.push({ value: '.kilorules', label: 'Kilo Rules (.kilorules)' });
  if (env.kirorules) availableConfigs.push({ value: '.kirorules', label: 'Kiro Rules (.kirorules)' });
  if (env.openclawrules) availableConfigs.push({ value: '.openclawrules', label: 'OpenClaw Rules (.openclawrules)' });
  if (env.factorydroidrules) availableConfigs.push({ value: '.factorydroidrules', label: 'Factory Droid Rules (.factorydroidrules)' });
  if (env.hermesrules) availableConfigs.push({ value: '.hermesrules', label: 'Hermes Rules (.hermesrules)' });
  if (env.windsurf) availableConfigs.push({ value: '.windsurfrules', label: 'Windsurf Rules (.windsurfrules)' });

  // Fallbacks if nothing detected
  if (availableConfigs.length === 0) {
    availableConfigs.push(
      { value: '.cursorrules', label: 'Cursor Rules (.cursorrules)' },
      { value: '.claudecoderc', label: 'Claude Code (.claudecoderc)' },
      { value: 'CLAUDE.md', label: 'Claude MD (CLAUDE.md)' },
      { value: '.github/copilot-instructions.md', label: 'GitHub Copilot (.github/copilot-instructions.md)' },
      { value: 'AGENTS.md', label: 'Agents MD (AGENTS.md)' },
      { value: '.aider.instructions.md', label: 'Aider Rules (.aider.instructions.md)' },
      { value: '.traerules', label: 'Trae Rules (.traerules)' },
      { value: '.windsurfrules', label: 'Windsurf Rules (.windsurfrules)' }
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
      return;
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
    return;
  }

  const writeSpinner = p.spinner();
  writeSpinner.start('Writing rule configurations to files...');
  for (const target of selectedTargets) {
    const fullPath = path.join(currentDir, target);
    const parentDir = path.dirname(fullPath);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }
    
    // Use delimited sections to preserve existing content
    const START_MARKER = `<!-- jagopakaiai:${skillName}:start -->`;
    const END_MARKER = `<!-- jagopakaiai:${skillName}:end -->`;
    const blockContent = [
      START_MARKER,
      `# JagoPakaiAI Integrated Skill Rules: ${skillName}`,
      '',
      ruleContent,
      END_MARKER
    ].join('\n');

    let existingContent = '';
    if (fs.existsSync(fullPath)) {
      existingContent = fs.readFileSync(fullPath, 'utf-8');
    }

    let finalContent: string;
    const startIdx = existingContent.indexOf(START_MARKER);
    const endIdx = existingContent.indexOf(END_MARKER);
    if (startIdx !== -1 && endIdx !== -1) {
      // Replace existing section for this skill
      finalContent = existingContent.substring(0, startIdx) + blockContent + existingContent.substring(endIdx + END_MARKER.length);
    } else if (existingContent.trim().length > 0) {
      // Append to existing content
      finalContent = existingContent.trimEnd() + '\n\n' + blockContent + '\n';
    } else {
      // New file
      finalContent = blockContent + '\n';
    }

    fs.writeFileSync(fullPath, finalContent);
    p.log.success(`Synchronized: ${target}`);
  }
  writeSpinner.stop('Writing complete!');

  p.outro('Synchronization successfully completed!');
}
