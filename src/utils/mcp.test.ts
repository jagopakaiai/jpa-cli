import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { getClaudeConfig, saveClaudeConfig, checkMcpInstalled } from './mcp.js';

describe('MCP Configuration Utility', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should return empty config if file does not exist', () => {
    vi.spyOn(fs, 'existsSync').mockReturnValue(false);
    expect(getClaudeConfig()).toEqual({});
  });

  it('should read config correctly if file exists', () => {
    vi.spyOn(fs, 'existsSync').mockReturnValue(true);
    vi.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify({ mcpServers: { sqlite: { command: 'npx', args: [] } } }));

    const config = getClaudeConfig();
    expect(config.mcpServers).toHaveProperty('sqlite');
  });

  it('should check if MCP is installed', () => {
    // 1st run: installed
    vi.spyOn(fs, 'existsSync').mockReturnValue(true);
    vi.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify({ mcpServers: { sqlite: { command: 'npx', args: [] } } }));
    expect(checkMcpInstalled('sqlite')).toBe(true);
    
    // 2nd run: not installed
    vi.restoreAllMocks();
    vi.spyOn(fs, 'existsSync').mockReturnValue(true);
    vi.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify({ mcpServers: {} }));
    expect(checkMcpInstalled('sqlite')).toBe(false);
  });
});
