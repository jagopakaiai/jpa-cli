import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { 
  parseSkillFile, 
  generateSkillTemplate, 
  isWorkspaceSkillInstalled, 
  isGlobalSkillInstalled, 
  isSkillSynced,
  parseAwesomeAgentSkills,
  whiteLabelSkillContent,
  generateRichSkillContent
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
    if (fs.existsSync(TEMP_TEST_DIR)) {
      fs.rmSync(TEMP_TEST_DIR, { recursive: true, force: true });
    }
  });

  // ─── Parse Skill File ─────────────────────────────────────────
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

  it('should parse skill files with single-quoted descriptions', () => {
    const filePath = path.join(TEMP_TEST_DIR, 'SKILL_SINGLE.md');
    const content = "---\nname: single-quoted-skill\ndescription: 'A skill using single quotes'\n---\n# Body";
    fs.writeFileSync(filePath, content);
    const parsed = parseSkillFile(filePath);
    expect(parsed.isValid).toBe(true);
    expect(parsed.metadata.name).toBe('single-quoted-skill');
    expect(parsed.metadata.description).toBe('A skill using single quotes');
  });

  it('should parse skill files with unquoted descriptions', () => {
    const filePath = path.join(TEMP_TEST_DIR, 'SKILL_UNQUOTED.md');
    const content = '---\nname: unquoted-skill\ndescription: A skill without quotes\n---\n# Body';
    fs.writeFileSync(filePath, content);
    const parsed = parseSkillFile(filePath);
    expect(parsed.isValid).toBe(true);
    expect(parsed.metadata.name).toBe('unquoted-skill');
    expect(parsed.metadata.description).toBe('A skill without quotes');
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

  it('should invalidate when both name and description are missing', () => {
    const filePath = path.join(TEMP_TEST_DIR, 'EMPTY_SKILL.md');
    const content = '---\nfoo: bar\n---\n# No name or description';
    fs.writeFileSync(filePath, content);
    const parsed = parseSkillFile(filePath);
    expect(parsed.isValid).toBe(false);
    expect(parsed.errors).toContain('Missing required frontmatter property: "name"');
    expect(parsed.errors).toContain('Missing required frontmatter property: "description"');
  });

  it('should invalidate when file does not exist', () => {
    const parsed = parseSkillFile('/nonexistent/path/SKILL.md');
    expect(parsed.isValid).toBe(false);
    expect(parsed.errors).toContain('File does not exist.');
  });

  it('should invalidate when file has no frontmatter', () => {
    const filePath = path.join(TEMP_TEST_DIR, 'NO_FRONTMATTER.md');
    fs.writeFileSync(filePath, '# Just a heading\nNo frontmatter here');
    const parsed = parseSkillFile(filePath);
    expect(parsed.isValid).toBe(false);
    expect(parsed.errors[0]).toContain('YAML frontmatter structure');
  });

  it('should handle comments in frontmatter', () => {
    const filePath = path.join(TEMP_TEST_DIR, 'COMMENTED.md');
    const content = [
      '---',
      'name: commented-skill',
      '# this is a comment',
      'description: "Skill with comments"',
      '---',
      'Body here'
    ].join('\n');
    fs.writeFileSync(filePath, content);
    const parsed = parseSkillFile(filePath);
    expect(parsed.isValid).toBe(true);
    expect(parsed.metadata.name).toBe('commented-skill');
  });

  it('should handle Windows-style line endings (\\r\\n)', () => {
    const filePath = path.join(TEMP_TEST_DIR, 'WINDOWS_EOL.md');
    const content = '---\r\nname: win-skill\r\ndescription: "Windows EOL"\r\n---\r\n# Body';
    fs.writeFileSync(filePath, content);
    const parsed = parseSkillFile(filePath);
    expect(parsed.isValid).toBe(true);
    expect(parsed.metadata.name).toBe('win-skill');
  });

  it('should parse metas beyond name and description', () => {
    const filePath = path.join(TEMP_TEST_DIR, 'EXTRA_META.md');
    const content = '---\nname: extra-skill\ndescription: "Has extra"\nversion: 2\nauthor: test\n---\nBody';
    fs.writeFileSync(filePath, content);
    const parsed = parseSkillFile(filePath);
    expect(parsed.isValid).toBe(true);
    expect(parsed.metadata.version).toBe('2');
    expect(parsed.metadata.author).toBe('test');
  });

  // ─── Installed Skill Checks ────────────────────────────────────
  it('should verify workspace and global skill helper existence checks', () => {
    expect(typeof isWorkspaceSkillInstalled).toBe('function');
    expect(typeof isGlobalSkillInstalled).toBe('function');
    expect(typeof isSkillSynced).toBe('function');

    expect(isWorkspaceSkillInstalled('non-existent-skill-abc')).toBe(false);
    expect(isGlobalSkillInstalled('non-existent-skill-abc')).toBe(false);
    expect(isSkillSynced('non-existent-skill-abc')).toBe(false);
  });

  // ─── Parse Awesome Agent Skills ────────────────────────────────
  it('should parse awesome-agent-skills README format correctly', () => {
    const readmeFile = path.join(TEMP_TEST_DIR, 'README.md');
    const content = [
      '# Curated list',
      '- **[voltagent/create-voltagent](https://officialskills.sh/voltagent/skills/create-voltagent)** - Project setup guide with CLI and manual steps',
      '- **[angular/angular-developer](https://github.com/angular/skills)** - Generate Angular code and architectural guidance',
      'Some random text'
    ].join('\n');
    fs.writeFileSync(readmeFile, content);

    const parsed = parseAwesomeAgentSkills(readmeFile);
    expect(parsed).toHaveLength(2);
    expect(parsed[0].name).toBe('voltagent/create-voltagent');
    expect(parsed[0].url).toBe('https://officialskills.sh/voltagent/skills/create-voltagent');
    expect(parsed[0].description).toBe('Project setup guide with CLI and manual steps');
    
    expect(parsed[1].name).toBe('angular/angular-developer');
    expect(parsed[1].url).toBe('https://github.com/angular/skills');
    expect(parsed[1].description).toBe('Generate Angular code and architectural guidance');
  });

  it('should return empty array for non-existent README', () => {
    const parsed = parseAwesomeAgentSkills('/nonexistent/README.md');
    expect(parsed).toEqual([]);
  });

  it('should return empty array for README with no valid entries', () => {
    const readmeFile = path.join(TEMP_TEST_DIR, 'EMPTY_README.md');
    fs.writeFileSync(readmeFile, '# Just a heading\nNo valid links here');
    const parsed = parseAwesomeAgentSkills(readmeFile);
    expect(parsed).toEqual([]);
  });

  // ─── White-label Content ──────────────────────────────────────
  it('should white-label content and prepend frontmatter if missing', () => {
    const rawContent = 'This is a superpower using-superpowers created by Jesse Vincent at officialskills.sh';
    const result = whiteLabelSkillContent(rawContent, 'my-skill', 'my description');
    
    expect(result).toContain('name: my-skill');
    expect(result).toContain('description: "my description"');
    expect(result).toContain('JagoPakaiAI');
    expect(result).toContain('using-skills');
    expect(result).toContain('JagoPakaiAI Team');
    expect(result).toContain('jagopakaiai.my.id');
    expect(result).not.toContain('superpowers');
    expect(result).not.toContain('Jesse Vincent');
    expect(result).not.toContain('officialskills.sh');
  });

  it('should not duplicate frontmatter if content already has it', () => {
    const rawContent = '---\nname: existing-skill\ndescription: "Existing"\n---\nExisting content with superpowers';
    const result = whiteLabelSkillContent(rawContent, 'existing-skill', 'Existing');
    // Should not have double frontmatter
    const frontmatterMatches = (result.match(/---/g) || []).length;
    expect(frontmatterMatches).toBe(2); // Only opening and closing ---
    expect(result).toContain('existing-skill');
    expect(result).not.toContain('superpowers');
    expect(result).toContain('JagoPakaiAI'); // white-labeled
  });

  it('should white-label VoltAgent references', () => {
    const rawContent = 'Created by VoltAgent for testing';
    const result = whiteLabelSkillContent(rawContent, 'test', 'desc');
    expect(result).toContain('JagoPakaiAI');
    expect(result).not.toContain('VoltAgent');
  });

  // ─── Generate Skill Template ──────────────────────────────────
  it('should generate a skill template with metadata', () => {
    const template = generateSkillTemplate('my-test-skill', 'A test description');
    expect(template).toContain('name: my-test-skill');
    expect(template).toContain('description: "A test description"');
    expect(template).toContain('## Overview');
    expect(template).toContain('## When to Use');
    expect(template).toContain('## Workflow');
    expect(template).toContain('## Instructions');
    expect(template).toContain('## Examples');
    expect(template).toContain('## Troubleshooting');
  });

  // ─── Generate Rich Skill Content ──────────────────────────────
  it('should generate rich skill content with all parameters', () => {
    const content = generateRichSkillContent({
      name: 'rich-skill',
      description: 'A rich skill',
      category: 'coding',
      triggers: ['When user asks to refactor', 'When analyzing code'],
      workflow: ['Analyze structure', 'Apply changes', 'Verify results'],
      instructions: ['Follow project conventions', 'Write tests'],
      tools: ['MCP: filesystem', 'Linter']
    });
    expect(content).toContain('name: rich-skill');
    expect(content).toContain('category: coding');
    expect(content).toContain('When user asks to refactor');
    expect(content).toContain('1. Analyze structure');
    expect(content).toContain('Follow project conventions');
    expect(content).toContain('MCP: filesystem');
  });

  it('should generate minimal rich skill content with empty arrays', () => {
    const content = generateRichSkillContent({
      name: 'minimal',
      description: 'Minimal',
      category: 'custom',
      triggers: [],
      workflow: [],
      instructions: [],
      tools: []
    });
    expect(content).toContain('name: minimal');
    // Should not include empty sections
    expect(content).not.toContain('## Instructions');
    expect(content).not.toContain('## When to Use');
    expect(content).toContain('## Examples'); // Always included
  });
});