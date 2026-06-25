import * as p from '@clack/prompts';
import { saveApiKey } from '../utils/config.js';

export async function loginCommand() {
  p.intro('JagoPakaiAI Login');
  const apiKey = await p.password({
    message: 'Enter your JagoPakaiAI API Key:',
    validate: (value) => {
      if (!value || value.trim().length === 0) return 'API Key is required!';
    }
  });

  if (p.isCancel(apiKey)) {
    p.cancel('Operation cancelled.');
    process.exit(0);
  }

  saveApiKey(apiKey as string);
  p.outro('Successfully logged in! Your API key is saved.');
}
