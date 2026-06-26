import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { getClaudeConfig, saveClaudeConfig, checkMcpInstalled, installMcpServer } from './mcp.js';
import { execSync } from 'child_process';

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

  it('should write config correctly when installMcpServer is called', () => {
    const mockExistsSync = vi.spyOn(fs, 'existsSync').mockImplementation((p) => {
      const pStr = p.toString();
      if (pStr.includes('.claudecode')) return false;
      if (pStr.includes('mcp')) return true;
      return false;
    });
    vi.spyOn(fs, 'readdirSync').mockImplementation((p) => {
      if (p.toString().includes('mcp')) {
        return ['sqlite'] as any;
      }
      return [];
    });
    vi.spyOn(fs, 'statSync').mockImplementation(() => {
      return { isDirectory: () => true } as any;
    });
    vi.spyOn(fs, 'readFileSync').mockImplementation((p) => {
      if (p.toString().includes('sqlite') && p.toString().includes('config.json')) {
        return JSON.stringify({
          name: 'sqlite',
          displayName: 'SQLite',
          description: 'SQLite database inspection and operations tool',
          mcpConfig: {
            command: 'npx',
            args: ['-y', '@modelcontextprotocol/server-sqlite', '--db', 'sqlite.db']
          }
        });
      }
      return '{}';
    });
    const mockWriteFileSync = vi.spyOn(fs, 'writeFileSync').mockImplementation(() => {});
    const mockMkdirSync = vi.spyOn(fs, 'mkdirSync').mockImplementation(() => undefined);
    
    installMcpServer('sqlite', ['--db', 'custom.db'], { MY_VAR: 'value' });
    
    expect(mockWriteFileSync).toHaveBeenCalled();
    const [filePath, content] = mockWriteFileSync.mock.calls[0];
    const parsed = JSON.parse(content as string);
    expect(parsed.mcpServers.sqlite.args).toContain('custom.db');
    expect(parsed.mcpServers.sqlite.env).toEqual({ MY_VAR: 'value' });
  });
});
