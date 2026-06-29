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
    return;
  }

  const s = p.spinner();
  s.start('Validating API key...');
  try {
    const apiUrl = (process.env.JAGOPAKAIAI_API_URL || 'https://jagopakaiai.my.id/api').replace(/\/+$/, '');
    await axios.get(`${apiUrl}/skills`, {
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
      return;
    }
  }

  saveApiKey(apiKey as string);
  p.outro('Successfully logged in! Your API key is saved.');
}
