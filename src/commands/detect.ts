import * as p from '@clack/prompts';
import { getApiKey } from '../utils/config.js';
import { detectWorkspace } from '../utils/detector.js';

export async function detectCommand() {
  p.intro('JagoPakaiAI Workspace Detector');
  
  const s = p.spinner();
  s.start('Scanning directory...');
  const currentDir = process.cwd();
  const env = detectWorkspace(currentDir);
  s.stop('Scan complete!');

  const apiKey = getApiKey();
  const apiKeyStatus = apiKey ? 'Active (Key Saved)' : 'Missing (Use "jagopakaiai-cli login" to authenticate)';

  const details = [
    `Workspace: ${currentDir}`,
    `API Key: ${apiKeyStatus}`,
    `Git Repo: ${env.git ? 'Yes' : 'No'}`,
    `Cursor Rules Config: ${env.cursor ? 'Detected' : 'Not found'}`,
    `Claude Code Config: ${env.claude ? 'Detected' : 'Not found'}`,
    `Copilot Config: ${env.copilot ? 'Detected' : 'Not found'}`,
    `Project Type: ${env.projectType || 'Unknown/Generic'}`
  ].join('\n');

  p.note(details, 'Audit Summary');
  p.outro('To sync rules, run: jagopakaiai-cli sync <skill-name>');
}
