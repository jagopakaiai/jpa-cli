import fs from 'fs';
import path from 'path';
import os from 'os';

const CONFIG_DIR = path.join(os.homedir(), '.config', 'jagopakaiai-cli');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

export function getConfigPath(): string {
  return CONFIG_FILE;
}

export function saveApiKey(key: string): void {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
  const config = { apiKey: key };
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), { mode: 0o600 });
}

export function getApiKey(): string | null {
  if (!fs.existsSync(CONFIG_FILE)) {
    return null;
  }
  try {
    const data = fs.readFileSync(CONFIG_FILE, 'utf-8');
    const config = JSON.parse(data);
    return config.apiKey || null;
  } catch {
    return null;
  }
}

export function deleteApiKey(): void {
  if (fs.existsSync(CONFIG_FILE)) {
    fs.unlinkSync(CONFIG_FILE);
  }
}
