import { describe, it, expect } from 'vitest';
import { CLI_VERSION } from './version.js';

describe('Version Module', () => {
  it('should export a valid version string', () => {
    expect(CLI_VERSION).toBeDefined();
    expect(typeof CLI_VERSION).toBe('string');
    expect(CLI_VERSION.length).toBeGreaterThan(0);
  });

  it('should match semver format (major.minor.patch)', () => {
    expect(CLI_VERSION).toMatch(/^\d+\.\d+\.\d+/);
  });
});