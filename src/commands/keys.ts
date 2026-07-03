import * as p from '@clack/prompts';
import pc from 'picocolors';
import {
  saveApiKey,
  getApiKey,
  saveGeminiApiKey,
  getGeminiApiKey,
  saveOpenRouterApiKey,
  getOpenRouterApiKey,
  saveGroqApiKey,
  getGroqApiKey,
  readConfig,
  writeConfig
} from '../utils/config.js';

const VALID_PROVIDERS = ['gemini', 'openrouter', 'groq', 'jpa'];

export async function keysCommand(providerArg?: string, keyArg?: string) {
  // If direct arguments are provided
  if (providerArg) {
    const provider = providerArg.toLowerCase();
    if (!VALID_PROVIDERS.includes(provider)) {
      p.log.error(`Invalid provider: "${providerArg}". Valid providers are: ${VALID_PROVIDERS.join(', ')}`);
      return;
    }

    if (keyArg) {
      // Direct set
      saveKeyForProvider(provider, keyArg);
      p.log.success(`Successfully saved API key for ${getProviderLabel(provider)}.`);
      return;
    } else {
      // Prompt for key for this specific provider
      p.intro(`Setup key for ${getProviderLabel(provider)}`);
      const key = await p.password({
        message: `Enter API Key for ${getProviderLabel(provider)}:`,
        validate: (value) => {
          if (!value || value.trim().length === 0) return 'API Key is required!';
        }
      });

      if (p.isCancel(key)) {
        p.cancel('Operation cancelled.');
        return;
      }

      saveKeyForProvider(provider, key as string);
      p.outro(`Successfully saved API key for ${getProviderLabel(provider)}.`);
      return;
    }
  }

  // Interactive menu mode
  p.intro('JPA CLI API Keys Manager');

  while (true) {
    // Show current keys status
    const jagoStatus = getApiKey() ? pc.green('Active (Key Saved)') : pc.red('Not Configured');
    const geminiStatus = getGeminiApiKey() ? pc.green('Active (Key Saved)') : pc.red('Not Configured');
    const openrouterStatus = getOpenRouterApiKey() ? pc.green('Active (Key Saved)') : pc.red('Not Configured');
    const groqStatus = getGroqApiKey() ? pc.green('Active (Key Saved)') : pc.red('Not Configured');

    p.log.info(
      `Current Status:\n` +
      `  • JPA CLI API : ${jagoStatus}\n` +
      `  • Gemini API      : ${geminiStatus}\n` +
      `  • OpenRouter API  : ${openrouterStatus}\n` +
      `  • Groq API        : ${groqStatus}`
    );

    const action = await p.select({
      message: 'Select action:',
      options: [
        { value: 'jpa', label: '🔑 Configure JPA CLI API Key' },
        { value: 'gemini', label: '🔑 Configure Gemini API Key' },
        { value: 'openrouter', label: '🔑 Configure OpenRouter API Key' },
        { value: 'groq', label: '🔑 Configure Groq API Key' },
        { value: 'delete', label: '🗑️  Delete an API Key' },
        { value: 'exit', label: '🚪 Exit' }
      ]
    });

    if (p.isCancel(action) || action === 'exit') {
      break;
    }

    if (action === 'delete') {
      const deleteTarget = await p.select({
        message: 'Select key to delete:',
        options: [
          { value: 'jpa', label: 'JPA CLI API Key' },
          { value: 'gemini', label: 'Gemini API Key' },
          { value: 'openrouter', label: 'OpenRouter API Key' },
          { value: 'groq', label: 'Groq API Key' },
          { value: 'back', label: '↩️ Back' }
        ]
      });

      if (p.isCancel(deleteTarget) || deleteTarget === 'back') {
        continue;
      }

      deleteKeyForProvider(deleteTarget as string);
      p.log.success(`Deleted API key for ${getProviderLabel(deleteTarget as string)}.`);
      continue;
    }

    // Configure a provider key
    const provider = action as string;
    const key = await p.password({
      message: `Enter API Key for ${getProviderLabel(provider)}:`,
      validate: (value) => {
        if (!value || value.trim().length === 0) return 'API Key is required!';
      }
    });

    if (p.isCancel(key)) {
      continue;
    }

    saveKeyForProvider(provider, key as string);
    p.log.success(`Successfully saved API key for ${getProviderLabel(provider)}.`);
  }

  p.outro('API key configurations finished.');
}

function getProviderLabel(provider: string): string {
  switch (provider) {
    case 'gemini': return 'Gemini API';
    case 'openrouter': return 'OpenRouter API';
    case 'groq': return 'Groq API';
    case 'jpa': return 'JPA CLI API';
    default: return provider;
  }
}

function saveKeyForProvider(provider: string, key: string) {
  switch (provider) {
    case 'gemini':
      saveGeminiApiKey(key);
      break;
    case 'openrouter':
      saveOpenRouterApiKey(key);
      break;
    case 'groq':
      saveGroqApiKey(key);
      break;
    case 'jpa':
      saveApiKey(key);
      break;
  }
}

function deleteKeyForProvider(provider: string) {
  const config = readConfig();
  switch (provider) {
    case 'gemini':
      delete config.geminiApiKey;
      break;
    case 'openrouter':
      delete config.openrouterApiKey;
      break;
    case 'groq':
      delete config.groqApiKey;
      break;
    case 'jpa':
      delete config.apiKey;
      break;
  }
  writeConfig(config);
}
