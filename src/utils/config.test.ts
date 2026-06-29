import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import {
  saveApiKey,
  getApiKey,
  deleteApiKey,
  saveGeminiApiKey,
  getGeminiApiKey,
  saveOpenRouterApiKey,
  getOpenRouterApiKey,
  saveGroqApiKey,
  getGroqApiKey,
  readConfig,
  writeConfig,
  getConfigPath
} from './config.js';

describe('Config Utility', () => {
  beforeEach(() => {
    // Clear config by writing empty object directly
    const configPath = getConfigPath();
    const configDir = path.dirname(configPath);
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
    fs.writeFileSync(configPath, '{}', { mode: 0o600 });
  });

  afterEach(() => {
    const configPath = getConfigPath();
    const configDir = path.dirname(configPath);
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
    fs.writeFileSync(configPath, '{}', { mode: 0o600 });
  });

  it('should save and retrieve the JagoPakaiAI API key', () => {
    const testKey = 'test-api-key-12345';
    saveApiKey(testKey);
    expect(getApiKey()).toBe(testKey);
  });

  it('should return null when JagoPakaiAI key does not exist', () => {
    expect(getApiKey()).toBeNull();
  });

  it('should save and retrieve the Gemini API key', () => {
    const testKey = 'gemini-key-123';
    saveGeminiApiKey(testKey);
    expect(getGeminiApiKey()).toBe(testKey);
  });

  it('should save and retrieve the OpenRouter API key', () => {
    const testKey = 'openrouter-key-456';
    saveOpenRouterApiKey(testKey);
    expect(getOpenRouterApiKey()).toBe(testKey);
  });

  it('should save and retrieve the Groq API key', () => {
    const testKey = 'groq-key-789';
    saveGroqApiKey(testKey);
    expect(getGroqApiKey()).toBe(testKey);
  });

  it('should preserve other keys when updating a specific key', () => {
    saveApiKey('jago-val');
    saveGeminiApiKey('gemini-val');
    saveOpenRouterApiKey('or-val');
    saveGroqApiKey('groq-val');

    expect(getApiKey()).toBe('jago-val');
    expect(getGeminiApiKey()).toBe('gemini-val');
    expect(getOpenRouterApiKey()).toBe('or-val');
    expect(getGroqApiKey()).toBe('groq-val');
  });

  it('should delete the API key properly', () => {
    saveApiKey('temp-key');
    expect(getApiKey()).toBe('temp-key');
    deleteApiKey();
    expect(getApiKey()).toBeNull();
  });

  it('should return empty config path that ends with config.json', () => {
    const configPath = getConfigPath();
    expect(configPath).toContain('config.json');
    expect(configPath).toContain('.config');
    expect(configPath).toContain('jagopakaiai-cli');
  });

  it('should return empty object for non-existent config file', () => {
    // Delete the config file completely
    const configPath = getConfigPath();
    if (fs.existsSync(configPath)) {
      fs.unlinkSync(configPath);
    }
    const config = readConfig();
    expect(config).toEqual({});
  });

  it('should write config and make it readable', () => {
    const testConfig = { apiKey: 'test-write-key', someOtherKey: 'value' };
    writeConfig(testConfig);
    const read = readConfig();
    expect(read.apiKey).toBe('test-write-key');
    expect(read.someOtherKey).toBe('value');
  });

  it('should handle JSON parse errors gracefully', () => {
    const configPath = getConfigPath();
    // Write invalid JSON
    fs.writeFileSync(configPath, '{invalid json}', { mode: 0o600 });
    const config = readConfig();
    expect(config).toEqual({});
  });

  it('should allow updating and reading all keys simultaneously', () => {
    saveApiKey('api-1');
    saveGeminiApiKey('gemini-2');
    saveOpenRouterApiKey('openrouter-3');
    saveGroqApiKey('groq-4');

    const config = readConfig();
    expect(config.apiKey).toBe('api-1');
    expect(config.geminiApiKey).toBe('gemini-2');
    expect(config.openrouterApiKey).toBe('openrouter-3');
    expect(config.groqApiKey).toBe('groq-4');
  });

  it('should support arbitrary config keys via writeConfig/readConfig', () => {
    writeConfig({ customKey: 'customValue', nested: { value: 123 } });
    const config = readConfig();
    expect(config.customKey).toBe('customValue');
    expect(config.nested.value).toBe(123);
  });
});