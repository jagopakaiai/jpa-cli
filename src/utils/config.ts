import fs from 'fs';
import path from 'path';
import os from 'os';

const CONFIG_DIR = path.join(os.homedir(), '.config', 'jagopakaiai-cli');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

export interface ConfigData {
  apiKey?: string;
  geminiApiKey?: string;
  openrouterApiKey?: string;
  groqApiKey?: string;
  [key: string]: any;
}

export function getConfigPath(): string {
  return CONFIG_FILE;
}

export function readConfig(): ConfigData {
  if (!fs.existsSync(CONFIG_FILE)) {
    return {};
  }
  try {
    const data = fs.readFileSync(CONFIG_FILE, 'utf-8');
    return JSON.parse(data) || {};
  } catch {
    return {};
  }
}

export function writeConfig(config: ConfigData): void {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), { mode: 0o600 });
}

export function saveApiKey(key: string): void {
  const config = readConfig();
  config.apiKey = key;
  writeConfig(config);
}

export function getApiKey(): string | null {
  return readConfig().apiKey || null;
}

export function deleteApiKey(): void {
  if (fs.existsSync(CONFIG_FILE)) {
    fs.unlinkSync(CONFIG_FILE);
  }
}

// Gemini API Key
export function saveGeminiApiKey(key: string): void {
  const config = readConfig();
  config.geminiApiKey = key;
  writeConfig(config);
}

export function getGeminiApiKey(): string | null {
  return readConfig().geminiApiKey || null;
}

// OpenRouter API Key
export function saveOpenRouterApiKey(key: string): void {
  const config = readConfig();
  config.openrouterApiKey = key;
  writeConfig(config);
}

export function getOpenRouterApiKey(): string | null {
  return readConfig().openrouterApiKey || null;
}

// Groq API Key
export function saveGroqApiKey(key: string): void {
  const config = readConfig();
  config.groqApiKey = key;
  writeConfig(config);
}

export function getGroqApiKey(): string | null {
  return readConfig().groqApiKey || null;
}
