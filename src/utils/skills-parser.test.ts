import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { 
  parseSkillFile, 
  generateSkillTemplate, 
  isWorkspaceSkillInstalled, 
  isGlobalSkillInstalled, 
  isSkillSynced 
} from './skills-parser.js';

const TEMP_TEST_DIR = path.join(os.tmpdir(), 'jagopakai-test-skills');

describe('Skills Parser Utility', () => {
  beforeEach(() => {
    if (fs.existsSync(TEMP_TEST_DIR)) {
      fs.rmSync(TEMP_TEST_DIR, { recursive: true, force: true });
    }
    fs.mkdirSync(TEMP_TEST_DIR);
  });

  afterEach(() => {
    fs.rmSync(TEMP_TEST_DIR, { recursive: true, force: true });
  });

  it('should parse valid skill markdown files', () => {
    const filePath = path.join(TEMP_TEST_DIR, 'SKILL.md');
    const content = [
      '---',
      'name: testing-skill',
      'description: "A simple testing skill description"',
      '---',
      '# My Skill Body content here'
    ].join('\n');

    fs.writeFileSync(filePath, content);

    const parsed = parseSkillFile(filePath);
    expect(parsed.isValid).toBe(true);
    expect(parsed.metadata.name).toBe('testing-skill');
    expect(parsed.metadata.description).toBe('A simple testing skill description');
    expect(parsed.body.trim()).toBe('# My Skill Body content here');
  });

  it('should invalidate parsing on missing required fields', () => {
    const filePath = path.join(TEMP_TEST_DIR, 'BAD_SKILL.md');
    const content = [
      '---',
      'name: bad-skill',
      '---',
      '# Missing description'
    ].join('\n');

    fs.writeFileSync(filePath, content);

    const parsed = parseSkillFile(filePath);
    expect(parsed.isValid).toBe(false);
    expect(parsed.errors).toContain('Missing required frontmatter property: "description"');
  });

  it('should verify workspace and global skill helper existence checks', () => {
    expect(typeof isWorkspaceSkillInstalled).toBe('function');
    expect(typeof isGlobalSkillInstalled).toBe('function');
    expect(typeof isSkillSynced).toBe('function');

    expect(isWorkspaceSkillInstalled('non-existent-skill-abc')).toBe(false);
    expect(isGlobalSkillInstalled('non-existent-skill-abc')).toBe(false);
    expect(isSkillSynced('non-existent-skill-abc')).toBe(false);
  });
});
