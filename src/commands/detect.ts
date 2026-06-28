import * as p from '@clack/prompts';
import { getApiKey, getGeminiApiKey, getOpenRouterApiKey, getGroqApiKey } from '../utils/config.js';
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

  const geminiKey = getGeminiApiKey();
  const geminiStatus = geminiKey ? 'Active (Key Saved)' : 'Not Configured';

  const openrouterKey = getOpenRouterApiKey();
  const openrouterStatus = openrouterKey ? 'Active (Key Saved)' : 'Not Configured';

  const groqKey = getGroqApiKey();
  const groqStatus = groqKey ? 'Active (Key Saved)' : 'Not Configured';

  const details = [
    `Workspace: ${currentDir}`,
    `JagoPakaiAI API Key: ${apiKeyStatus}`,
    `Gemini API Key: ${geminiStatus}`,
    `OpenRouter API Key: ${openrouterStatus}`,
    `Groq API Key: ${groqStatus}`,
    `Git Repo: ${env.git ? 'Yes' : 'No'}`,
    `Cursor Rules Config: ${env.cursor ? 'Detected' : 'Not found'}`,
    `Claude Code Config: ${env.claude ? 'Detected' : 'Not found'}`,
    `Copilot Config: ${env.copilot ? 'Detected' : 'Not found'}`,
    `CLAUDE.md: ${env.claudeMd ? 'Detected' : 'Not found'}`,
    `Cursor Rules Dir (.cursor/rules/): ${env.cursorDir ? 'Detected' : 'Not found'}`,
    `Windsurf Config: ${env.windsurf ? 'Detected' : 'Not found'}`,
    `AGENTS.md: ${env.agentsMd ? 'Detected' : 'Not found'}`,
    `Aider Config: ${env.aiderRules ? 'Detected' : 'Not found'}`,
    `Trae Rules: ${env.traerules ? 'Detected' : 'Not found'}`,
    `Devin Config: ${env.devinDir ? 'Detected' : 'Not found'}`,
    `CodeBuddy Config: ${env.codebuddyrc ? 'Detected' : 'Not found'}`,
    `Codex Rules: ${env.codexrules ? 'Detected' : 'Not found'}`,
    `OpenCode Rules: ${env.opencoderules ? 'Detected' : 'Not found'}`,
    `Kilo Rules: ${env.kilorules ? 'Detected' : 'Not found'}`,
    `Kiro Rules: ${env.kirorules ? 'Detected' : 'Not found'}`,
    `OpenClaw Rules: ${env.openclawrules ? 'Detected' : 'Not found'}`,
    `Factory Droid Rules: ${env.factorydroidrules ? 'Detected' : 'Not found'}`,
    `Hermes Rules: ${env.hermesrules ? 'Detected' : 'Not found'}`,
    `Project Type: ${env.projectType || 'Unknown/Generic'}`
  ].join('\n');

  p.note(details, 'Audit Summary');
  p.outro('To sync rules, run: jagopakaiai-cli sync <skill-name> or configure keys with: jagopakaiai-cli keys');
}
