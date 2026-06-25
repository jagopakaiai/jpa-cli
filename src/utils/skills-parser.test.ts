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
  whiteLabelSkillContent
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
});
