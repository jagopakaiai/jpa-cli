import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { fetchSkillRule, fetchRawSkillFromUrl } from './api.js';

vi.mock('axios');

describe('API Utility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should query API and return rule content', async () => {
    const mockResponse = { data: { content: 'test-rule-content-here' } };
    vi.mocked(axios.get).mockResolvedValueOnce(mockResponse);

    const content = await fetchSkillRule('dummy-key', 'laravel-clean-api');
    expect(content).toBe('test-rule-content-here');
    expect(axios.get).toHaveBeenCalledWith(
      'https://jpa.my.id/api/skills/laravel-clean-api',
      {
        headers: { Authorization: 'Bearer dummy-key' },
        timeout: 15000
      }
    );
  });

  it('should use JPA_API_URL env var if set', async () => {
    const originalEnv = process.env.JPA_API_URL;
    process.env.JPA_API_URL = 'https://custom-api.example.com/v2';
    
    vi.mocked(axios.get).mockResolvedValueOnce({ data: { content: 'custom-url-content' } });
    
    const content = await fetchSkillRule('test-key', 'test-skill');
    expect(content).toBe('custom-url-content');
    expect(axios.get).toHaveBeenCalledWith(
      'https://custom-api.example.com/v2/skills/test-skill',
      expect.any(Object)
    );
    
    // Properly clean up — delete the key instead of setting to undefined
    delete process.env.JPA_API_URL;
    if (originalEnv !== undefined) {
      process.env.JAGOPAKAIAI_API_URL = originalEnv;
    }
  });

  it('should fallback to rules field if content is missing', async () => {
    const mockResponse = { data: { rules: 'fallback-rules-content' } };
    vi.mocked(axios.get).mockResolvedValueOnce(mockResponse);

    const content = await fetchSkillRule('dummy-key', 'test-skill');
    expect(content).toBe('fallback-rules-content');
  });

  it('should throw if both content and rules are missing', async () => {
    vi.mocked(axios.get).mockResolvedValueOnce({ data: { other: 'data' } });

    await expect(fetchSkillRule('dummy-key', 'test-skill')).rejects.toThrow(
      /API response did not return rule content/i
    );
  });

  it('should attempt fallback query param on primary failure', async () => {
    // Primary fails
    vi.mocked(axios.get)
      .mockRejectedValueOnce(new Error('404 Not Found'))
      // Fallback succeeds
      .mockResolvedValueOnce({ data: { content: 'fallback-content' } });

    const content = await fetchSkillRule('dummy-key', 'test-skill');
    expect(content).toBe('fallback-content');
    expect(axios.get).toHaveBeenNthCalledWith(
      2,
      'https://jpa.my.id/api/skills?name=test-skill',
      expect.any(Object)
    );
  });

  it('should find skill from list response in fallback', async () => {
    vi.mocked(axios.get)
      .mockRejectedValueOnce(new Error('404'))
      .mockResolvedValueOnce({
        data: [
          { name: 'other-skill', content: 'other' },
          { name: 'test-skill', slug: 'test-skill', content: 'found-in-list' }
        ]
      });

    const content = await fetchSkillRule('dummy-key', 'test-skill');
    expect(content).toBe('found-in-list');
  });

  it('should throw error when both primary and fallback fail', async () => {
    vi.mocked(axios.get)
      .mockRejectedValueOnce(new Error('Network Error'))
      .mockRejectedValueOnce(new Error('Also Failed'));

    await expect(fetchSkillRule('dummy-key', 'laravel-clean-api')).rejects.toThrow(
      /Failed to retrieve skill/i
    );
  });

  it('should fetch raw skill content from GitHub tree URLs', async () => {
    const mockResponse = { data: 'my-github-markdown-content' };
    vi.mocked(axios.get).mockResolvedValueOnce(mockResponse);

    const content = await fetchRawSkillFromUrl(
      'https://github.com/google-gemini/gemini-skills/tree/main/skills/gemini-api-dev'
    );
    expect(content).toBe('my-github-markdown-content');
    expect(axios.get).toHaveBeenCalledWith(
      'https://raw.githubusercontent.com/google-gemini/gemini-skills/main/skills/gemini-api-dev/SKILL.md',
      { timeout: 15000 }
    );
  });

  it('should also handle GitHub blob URLs', async () => {
    vi.mocked(axios.get).mockResolvedValueOnce({ data: 'blob-content' });

    const content = await fetchRawSkillFromUrl(
      'https://github.com/user/repo/blob/main/docs/SKILL.md'
    );
    expect(content).toBe('blob-content');
    expect(axios.get).toHaveBeenCalledWith(
      'https://raw.githubusercontent.com/user/repo/main/docs/SKILL.md',
      expect.any(Object)
    );
  });

  it('should try raw GitHub URLs with branch iteration', async () => {
    // First attempt fails (main branch)
    vi.mocked(axios.get)
      .mockRejectedValueOnce(new Error('not found'))
      .mockResolvedValueOnce({ data: 'found-on-master' });

    const content = await fetchRawSkillFromUrl('https://github.com/owner/myrepo');
    expect(content).toBe('found-on-master');
    // First call tries main branch, second call tries master
    expect(axios.get).toHaveBeenNthCalledWith(
      2,
      'https://raw.githubusercontent.com/owner/myrepo/master/SKILL.md',
      expect.any(Object)
    );
  });

  it('should try README.md as fallback on GitHub repos', async () => {
    vi.mocked(axios.get)
      .mockRejectedValueOnce(new Error('not found')) // SKILL.md main
      .mockRejectedValueOnce(new Error('not found')) // SKILL.md master
      .mockRejectedValueOnce(new Error('not found')) // README.md main
      .mockResolvedValueOnce({ data: 'readme-content' }); // README.md master

    const content = await fetchRawSkillFromUrl('https://github.com/owner/myrepo');
    expect(content).toBe('readme-content');
  });

  it('should fetch raw skill content from officialskills.sh URLs', async () => {
    // 1st get: returns HTML page
    const mockHtmlRes = {
      data: '<html><body><a href="https://github.com/voltagent/skills/tree/main/skills/create-voltagent">View GitHub</a></body></html>'
    };
    // 2nd get: returns Markdown content
    const mockMdRes = { data: 'my-voltagent-skill-markdown' };

    vi.mocked(axios.get)
      .mockResolvedValueOnce(mockHtmlRes)
      .mockResolvedValueOnce(mockMdRes);

    const content = await fetchRawSkillFromUrl(
      'https://officialskills.sh/voltagent/skills/create-voltagent'
    );
    expect(content).toBe('my-voltagent-skill-markdown');
    expect(axios.get).toHaveBeenNthCalledWith(
      1,
      'https://officialskills.sh/voltagent/skills/create-voltagent',
      { timeout: 15000 }
    );
    expect(axios.get).toHaveBeenNthCalledWith(
      2,
      'https://raw.githubusercontent.com/voltagent/skills/main/skills/create-voltagent/SKILL.md',
      { timeout: 15000 }
    );
  });

  it('should fallback to direct URL fetch if not GitHub or officialskills', async () => {
    vi.mocked(axios.get).mockResolvedValueOnce({ data: 'direct-content' });

    const content = await fetchRawSkillFromUrl('https://example.com/raw/skills.md');
    expect(content).toBe('direct-content');
    expect(axios.get).toHaveBeenCalledWith(
      'https://example.com/raw/skills.md',
      { timeout: 15000 }
    );
  });

  it('should handle non-string response as JSON string', async () => {
    vi.mocked(axios.get).mockResolvedValueOnce({ data: { key: 'value' } });

    const content = await fetchRawSkillFromUrl('https://example.com/api.json');
    expect(content).toBe('{"key":"value"}');
  });

  it('should throw on officialskills.sh error', async () => {
    vi.mocked(axios.get).mockRejectedValueOnce(new Error('Network error'));

    await expect(
      fetchRawSkillFromUrl('https://officialskills.sh/owner/skill/test')
    ).rejects.toThrow(/Failed to fetch from officialskills.sh/i);
  });
});