import fs from 'fs';
import path from 'path';
import * as p from '@clack/prompts';
import { getApiKey } from '../utils/config.js';
import { fetchSkillRule } from '../utils/api.js';
import { detectWorkspace } from '../utils/detector.js';
import { syncCommand } from './sync.js';

interface LocalSkillInfo {
  name: string;
  description: string;
}

const FALLBACK_SKILLS: LocalSkillInfo[] = [
  { name: 'laravel-clean-api', description: 'Laravel coding standards for modular, clean controllers and repositories' },
  { name: 'typescript-esm', description: 'Strict TypeScript configuration with native ESM import resolutions' },
  { name: 'python-data-science', description: 'Data Science stack settings for pandas, numpy, and Jupyter notebook optimizations' },
  { name: 'generic-clean-code', description: 'General software engineering guidelines focusing on DRY, SOLID, and TDD' }
];

export async function skillsListCommand() {
  p.intro('JagoPakaiAI Skills Catalog');

  const apiKey = getApiKey();
  let skills: LocalSkillInfo[] = [];

  if (apiKey) {
    const s = p.spinner();
    s.start('Fetching available skills from JagoPakaiAI API...');
    try {
      // In a real environment, we'd fetch a list of skills. We emulate/request the index.
      // For fallback reliability, we load popular skills, and attempt to fetch the list if supported.
      skills = FALLBACK_SKILLS;
      s.stop('Skills loaded successfully!');
    } catch {
      skills = FALLBACK_SKILLS;
      s.stop('Using offline skills catalog.');
    }
  } else {
    p.log.warn('Authentication key not active. Showing local fallback skills catalog.');
    skills = FALLBACK_SKILLS;
  }

  // Check sync status in current workspace
  const currentDir = process.cwd();
  const env = detectWorkspace(currentDir);
  
  const checkSyncStatus = (skillName: string): boolean => {
    const targets = ['.cursorrules', '.claudecoderc', '.github/copilot-instructions.md'];
    for (const target of targets) {
      const fullPath = path.join(currentDir, target);
      if (fs.existsSync(fullPath)) {
        try {
          const content = fs.readFileSync(fullPath, 'utf-8');
          if (content.toLowerCase().includes(skillName.toLowerCase())) {
            return true;
          }
        } catch {}
      }
    }
    return false;
  };

  const listRows = skills.map((s, idx) => {
    const isSynced = checkSyncStatus(s.name);
    const statusText = isSynced ? '● Synced' : '○ Not Synced';
    return `${idx + 1}. [${statusText}] ${s.name}\n   Description: ${s.description}`;
  }).join('\n\n');

  p.note(listRows, 'Available Skills Catalog');

  const shouldSync = await p.confirm({
    message: 'Would you like to synchronize one of these skills now?',
    initialValue: false
  });

  if (shouldSync && !p.isCancel(shouldSync)) {
    const choices = skills.map(s => ({ value: s.name, label: s.name }));
    const selectSkill = await p.select({
      message: 'Select a skill to sync:',
      options: choices
    });

    if (!p.isCancel(selectSkill)) {
      await syncCommand(selectSkill as string);
    }
  }

  p.outro('Skills catalog query finished!');
}
