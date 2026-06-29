import axios from 'axios';

/** Lazy-get API base URL so tests can set env var before each call */
function getApiBaseUrl(): string {
  return process.env.JAGOPAKAIAI_API_URL || 'https://jagopakaiai.my.id/api';
}

export async function fetchSkillRule(apiKey: string, skillName: string): Promise<string> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}/skills/${encodeURIComponent(skillName)}`;
  try {
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      },
      timeout: 15000
    });
    
    // Support standard content or content fallback
    if (response.data && typeof response.data.content === 'string') {
      return response.data.content;
    } else if (response.data && typeof response.data.rules === 'string') {
      return response.data.rules;
    } else {
      throw new Error('API response did not return rule content in expected format.');
    }
  } catch (error: any) {
    // In case path parameter returns 404, attempt query parameter fallback
    const baseUrl = getApiBaseUrl();
    const fallbackUrl = `${baseUrl}/skills?name=${encodeURIComponent(skillName)}`;
    try {
      const fallbackRes = await axios.get(fallbackUrl, {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        },
        timeout: 15000
      });
      if (fallbackRes.data && typeof fallbackRes.data.content === 'string') {
        return fallbackRes.data.content;
      } else if (fallbackRes.data && Array.isArray(fallbackRes.data)) {
        const found = (fallbackRes.data as any[]).find(
          (s: any) => s.name === skillName || s.slug === skillName
        );
        if (found && typeof found.content === 'string') return found.content;
      }
    } catch (fallbackErr: any) {
      // Fallback also failed, throw original error
      throw new Error(`Failed to retrieve skill from primary and fallback URLs: ${error instanceof Error ? error.message : String(error)}`);
    }

    throw new Error(`Failed to retrieve skill: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function fetchRawSkillFromUrl(url: string): Promise<string> {
  // If it's an officialskills.sh URL
  if (url.includes('officialskills.sh')) {
    try {
      // 1. Fetch officialskills.sh HTML
      const response = await axios.get(url, { timeout: 15000 });
      const html = response.data;
      
      // 2. Parse GitHub tree URL from HTML
      const githubMatch = html.match(/href="(https:\/\/github\.com\/[^/]+\/[^/]+\/tree\/[^"]+)"/);
      if (githubMatch) {
        const githubUrl = githubMatch[1];
        return await fetchRawSkillFromGitHubTree(githubUrl);
      }
      
      // Try fallback by direct mapping if parsing fails
      const parts = url.split('/');
      if (parts.length >= 6) {
        const owner = parts[3];
        const name = parts[5];
        const constructed = `https://raw.githubusercontent.com/${owner}/skills/main/skills/${name}/SKILL.md`;
        return await fetchUrlContent(constructed);
      }
    } catch (err: any) {
      throw new Error(`Failed to fetch from officialskills.sh: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // If it's a GitHub URL
  if (url.includes('github.com')) {
    if (url.includes('/tree/') || url.includes('/blob/')) {
      return await fetchRawSkillFromGitHubTree(url);
    } else {
      // Direct repo url, try raw SKILL.md on main/master branches
      const cleanUrl = url.replace(/\/$/, '');
      const parts = cleanUrl.split('/');
      const owner = parts[parts.length - 2];
      const repo = parts[parts.length - 1];
      
      for (const branch of ['main', 'master']) {
        try {
          const testUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/SKILL.md`;
          return await fetchUrlContent(testUrl);
        } catch {
          // Try next branch
        }
      }
      for (const branch of ['main', 'master']) {
        try {
          const testUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/README.md`;
          return await fetchUrlContent(testUrl);
        } catch {
          // Try next branch
        }
      }
      throw new Error(`Could not find SKILL.md or README.md on any branch for ${owner}/${repo}`);
    }
  }

  // Direct fetch fallback
  return await fetchUrlContent(url);
}

async function fetchUrlContent(url: string): Promise<string> {
  const res = await axios.get(url, { timeout: 15000 });
  if (typeof res.data === 'string') {
    return res.data;
  }
  return JSON.stringify(res.data);
}

async function fetchRawSkillFromGitHubTree(githubUrl: string): Promise<string> {
  let rawUrl = githubUrl
    .replace('github.com', 'raw.githubusercontent.com')
    .replace('/tree/', '/')
    .replace('/blob/', '/');
  
  if (!rawUrl.toLowerCase().endsWith('.md')) {
    rawUrl = rawUrl.replace(/\/$/, '') + '/SKILL.md';
  }
  return await fetchUrlContent(rawUrl);
}