import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  saveApiKey,
  getApiKey,
  deleteApiKey,
  saveGeminiApiKey,
  getGeminiApiKey,
  saveOpenRouterApiKey,
  getOpenRouterApiKey,
  saveGroqApiKey,
  getGroqApiKey
} from './config.js';

describe('Config Utility', () => {
  beforeEach(() => {
    deleteApiKey();
  });

  afterEach(() => {
    deleteApiKey();
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
});
