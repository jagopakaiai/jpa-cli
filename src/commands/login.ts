import * as p from '@clack/prompts';
import axios from 'axios';
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

  const s = p.spinner();
  s.start('Validating API key...');
  try {
    await axios.get('https://jagopakaiai.my.id/api/skills', {
      headers: { 'Authorization': `Bearer ${apiKey}` },
      timeout: 10000
    });
    s.stop('API key validated successfully!');
  } catch (err: any) {
    s.stop('Could not validate API key.');
    const shouldSave = await p.confirm({
      message: 'Server may be unreachable. Save the key anyway?',
      initialValue: false
    });
    if (p.isCancel(shouldSave) || !shouldSave) {
      p.cancel('Login cancelled.');
      process.exit(0);
    }
  }

  saveApiKey(apiKey as string);
  p.outro('Successfully logged in! Your API key is saved.');
}
