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
      'https://jagopakaiai.my.id/api/skills/laravel-clean-api',
      {
        headers: {
          Authorization: 'Bearer dummy-key'
        }
      }
    );
  });

  it('should fallback to query param or return error message on failure', async () => {
    vi.mocked(axios.get).mockRejectedValueOnce(new Error('Network Error'));

    await expect(fetchSkillRule('dummy-key', 'laravel-clean-api')).rejects.toThrow('Failed to retrieve skill: Network Error');
  });

  it('should fetch raw skill content from GitHub tree URLs', async () => {
    const mockResponse = { data: 'my-github-markdown-content' };
    vi.mocked(axios.get).mockResolvedValueOnce(mockResponse);

    const content = await fetchRawSkillFromUrl('https://github.com/google-gemini/gemini-skills/tree/main/skills/gemini-api-dev');
    expect(content).toBe('my-github-markdown-content');
    expect(axios.get).toHaveBeenCalledWith(
      'https://raw.githubusercontent.com/google-gemini/gemini-skills/main/skills/gemini-api-dev/SKILL.md'
    );
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

    const content = await fetchRawSkillFromUrl('https://officialskills.sh/voltagent/skills/create-voltagent');
    expect(content).toBe('my-voltagent-skill-markdown');
    expect(axios.get).toHaveBeenNthCalledWith(
      1,
      'https://officialskills.sh/voltagent/skills/create-voltagent'
    );
    expect(axios.get).toHaveBeenNthCalledWith(
      2,
      'https://raw.githubusercontent.com/voltagent/skills/main/skills/create-voltagent/SKILL.md'
    );
  });
});
