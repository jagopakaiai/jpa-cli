import axios from 'axios';

export async function fetchSkillRule(apiKey: string, skillName: string): Promise<string> {
  const url = `https://jagopakaiai.my.id/api/skills/${encodeURIComponent(skillName)}`;
  try {
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
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
    // In case path parameter returns 404, we can attempt query parameter fallback
    const fallbackUrl = `https://jagopakaiai.my.id/api/skills?name=${encodeURIComponent(skillName)}`;
    try {
      const fallbackRes = await axios.get(fallbackUrl, {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });
      if (fallbackRes.data && typeof fallbackRes.data.content === 'string') {
        return fallbackRes.data.content;
      } else if (fallbackRes.data && Array.isArray(fallbackRes.data)) {
        // If the list is returned, find by name
        const found = fallbackRes.data.find((s: any) => s.name === skillName || s.slug === skillName);
        if (found && typeof found.content === 'string') return found.content;
      }
    } catch {}

    throw new Error(`Failed to retrieve skill: ${error.message || error}`);
  }
}

export async function fetchRawSkillFromUrl(url: string): Promise<string> {
  // If it's an officialskills.sh URL
  if (url.includes('officialskills.sh')) {
    try {
      // 1. Fetch officialskills.sh HTML
      const response = await axios.get(url);
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
      throw new Error(`Failed to fetch from officialskills.sh: ${err.message}`);
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
        } catch {}
      }
      for (const branch of ['main', 'master']) {
        try {
          const testUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/README.md`;
          return await fetchUrlContent(testUrl);
        } catch {}
      }
    }
  }

  // Direct fetch fallback
  return await fetchUrlContent(url);
}

async function fetchUrlContent(url: string): Promise<string> {
  const res = await axios.get(url);
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
