import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';

vi.mock('child_process', () => {
  return {
    execSync: vi.fn().mockReturnValue(Buffer.from(''))
  };
});

import { getClaudeConfig, saveClaudeConfig, checkMcpInstalled, installMcpServer, getRecommendedMcps } from './mcp.js';

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
    vi.spyOn(fs, 'readFileSync').mockReturnValue(
      JSON.stringify({ mcpServers: { sqlite: { command: 'npx', args: [] } } })
    );

    const config = getClaudeConfig();
    expect(config.mcpServers).toHaveProperty('sqlite');
    expect(config.mcpServers!.sqlite.command).toBe('npx');
  });

  it('should return empty config on JSON parse error', () => {
    vi.spyOn(fs, 'existsSync').mockReturnValue(true);
    vi.spyOn(fs, 'readFileSync').mockReturnValue('{invalid json}');
    const config = getClaudeConfig();
    expect(config).toEqual({});
  });

  it('should check if MCP is installed', () => {
    // 1st run: installed
    vi.spyOn(fs, 'existsSync').mockReturnValue(true);
    vi.spyOn(fs, 'readFileSync').mockReturnValue(
      JSON.stringify({ mcpServers: { sqlite: { command: 'npx', args: [] } } })
    );
    expect(checkMcpInstalled('sqlite')).toBe(true);

    // Reset for 2nd run
    vi.restoreAllMocks();
    vi.spyOn(fs, 'existsSync').mockReturnValue(true);
    vi.spyOn(fs, 'readFileSync').mockReturnValue(
      JSON.stringify({ mcpServers: {} })
    );
    expect(checkMcpInstalled('sqlite')).toBe(false);
  });

  it('should check for multiple MCP servers', () => {
    vi.spyOn(fs, 'existsSync').mockReturnValue(true);
    vi.spyOn(fs, 'readFileSync').mockReturnValue(
      JSON.stringify({
        mcpServers: {
          sqlite: { command: 'npx', args: [] },
          postgres: { command: 'npx', args: [] }
        }
      })
    );
    expect(checkMcpInstalled('sqlite')).toBe(true);
    expect(checkMcpInstalled('postgres')).toBe(true);
    expect(checkMcpInstalled('github')).toBe(false);
  });

  it('should write config correctly when saveClaudeConfig is called', () => {
    const mockWrite = vi.spyOn(fs, 'writeFileSync').mockImplementation(() => {});
    const mockMkdir = vi.spyOn(fs, 'mkdirSync').mockImplementation(() => undefined);

    saveClaudeConfig({ mcpServers: { test: { command: 'test', args: ['arg1'] } } });

    expect(mockWrite).toHaveBeenCalled();
    const [filePath, content] = mockWrite.mock.calls[0];
    expect(content).toContain('test');
    expect(content).toContain('arg1');
  });

  it('should detect missing mcpServers key as not installed', () => {
    vi.spyOn(fs, 'existsSync').mockReturnValue(true);
    vi.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify({}));
    expect(checkMcpInstalled('anything')).toBe(false);
  });

  it('should install McpServer and write config with custom args and env', () => {
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

  it('should install MCP server without custom env', () => {
    const mockExistsSync = vi.spyOn(fs, 'existsSync').mockImplementation((p) => {
      if (p.toString().includes('.claudecode')) return false;
      if (p.toString().includes('mcp')) return true;
      return false;
    });
    vi.spyOn(fs, 'readdirSync').mockImplementation((p) => {
      if (p.toString().includes('mcp')) return ['sqlite'] as any;
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
          description: 'SQLite',
          mcpConfig: {
            command: 'npx',
            args: ['-y', '@modelcontextprotocol/server-sqlite', '--db', 'sqlite.db']
          }
        });
      }
      return '{}';
    });
    const mockWrite = vi.spyOn(fs, 'writeFileSync').mockImplementation(() => {});
    const mockMkdir = vi.spyOn(fs, 'mkdirSync').mockImplementation(() => undefined);

    installMcpServer('sqlite');

    expect(mockWrite).toHaveBeenCalled();
    const [_, content] = mockWrite.mock.calls[0];
    const parsed = JSON.parse(content as string);
    expect(parsed.mcpServers.sqlite.args).toContain('sqlite.db');
    expect(parsed.mcpServers.sqlite.env).toBeUndefined();
  });

  it('should throw error for unsupported MCP server', () => {
    vi.spyOn(fs, 'existsSync').mockImplementation((p) => {
      if (p.toString().includes('mcp')) return true;
      return false;
    });
    vi.spyOn(fs, 'readdirSync').mockImplementation((p) => {
      if (p.toString().includes('mcp')) return [];
      return [];
    });

    expect(() => installMcpServer('nonexistent-server')).toThrow(
      /not supported/i
    );
  });

  it('should return cached definitions on repeated calls', () => {
    const readdirSpy = vi.spyOn(fs, 'readdirSync').mockImplementation(() => {
      return ['sqlite'] as any;
    });
    vi.spyOn(fs, 'statSync').mockImplementation(() => {
      return { isDirectory: () => true } as any;
    });
    vi.spyOn(fs, 'readFileSync').mockImplementation((p) => {
      return JSON.stringify({
        name: 'sqlite',
        displayName: 'SQLite',
        description: 'SQLite database tool',
        mcpConfig: { command: 'npx', args: ['-y', 'server-sqlite'] }
      });
    });

    // First call
    const first = getRecommendedMcps();
    expect(first).toHaveLength(1);
    const callCount = readdirSpy.mock.calls.length;

    // Second call — should use cache
    const second = getRecommendedMcps();
    expect(second).toHaveLength(1);
    // readdir should not have been called again
    expect(readdirSpy.mock.calls.length).toBe(callCount);
  });
});