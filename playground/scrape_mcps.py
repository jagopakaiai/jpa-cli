import os
import re
import json
import urllib.request
import urllib.error
from concurrent.futures import ThreadPoolExecutor

TARGET_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'mcp')

def get_registry_links():
    links = []
    for page in range(1, 5):
        url = f"https://github.com/mcp?page={page}"
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        try:
            with urllib.request.urlopen(req) as resp:
                html = resp.read().decode('utf-8', errors='replace')
                found = re.findall(r'href="(/mcp/[^"?#"]+)"', html)
                for l in found:
                    parts = l.strip('/').split('/')
                    if len(parts) == 3 and parts[0] == 'mcp':
                        links.append(f"https://github.com{l}")
        except Exception as e:
            print(f"Error page {page}: {e}")
    return sorted(list(set(links)))

def fetch_detail(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req) as resp:
            html = resp.read().decode('utf-8', errors='replace')
            matches = re.finditer(r'<script[^>]*>(.*?mcpDetailsRoute.*?)</script>', html, re.DOTALL)
            for match in matches:
                content = match.group(1).strip()
                start_pos = 0
                while True:
                    json_start = content.find('{', start_pos)
                    if json_start == -1:
                        break
                    decoder = json.JSONDecoder()
                    try:
                        data, end_idx = decoder.raw_decode(content[json_start:])
                        payload = data.get('payload') or {}
                        route = payload.get('mcpDetailsRoute') or {}
                        server_data = route.get('server_data')
                        if server_data:
                            return server_data
                        start_pos = json_start + end_idx
                    except Exception:
                        start_pos = json_start + 1
    except Exception as e:
        print(f"Error detail {url}: {e}")
    return None

def process_server(url):
    server_data = fetch_detail(url)
    if not server_data:
        return False
    
    # Extract owner and repo from registry page URL
    parts = url.rstrip('/').split('/')
    owner = parts[-2] if len(parts) >= 2 else ''
    repo = parts[-1] if len(parts) >= 1 else ''
    normalized_name = f"{owner.lower()}-{repo.lower()}"
    
    dest_folder = os.path.join(TARGET_DIR, normalized_name)
    os.makedirs(dest_folder, exist_ok=True)
    
    # Write README
    repo_data = server_data.get('repository') or {}
    readme = repo_data.get('readme') or ''
    with open(os.path.join(dest_folder, 'README.md'), 'w', encoding='utf-8') as f:
        f.write(readme)
    
    # Map package to config
    mcp_config = {
        "command": "",
        "args": [],
        "env": {}
    }
    
    raw_data = server_data.get('raw_data') or {}
    server_info = raw_data.get('server') or {}
    packages = server_info.get('packages') or []
    
    if packages:
        pkg = packages[0] or {}
        identifier = pkg.get('identifier') or ''
        hint = pkg.get('runtimeHint') or ''
        reg_type = pkg.get('registryType') or ''
        
        if hint == 'uvx' or reg_type == 'pypi':
            mcp_config['command'] = 'uvx'
            mcp_config['args'] = [identifier]
        elif hint == 'npx' or reg_type == 'npm':
            mcp_config['command'] = 'npx'
            mcp_config['args'] = ['-y', identifier]
        elif hint == 'pip':
            mcp_config['command'] = 'python'
            mcp_config['args'] = ['-m', identifier]
        else:
            mcp_config['command'] = 'npx'
            mcp_config['args'] = ['-y', identifier]
            
    name = server_data.get('name') or ''
    description = server_data.get('description') or ''
    display_name = server_data.get('display_name') or ''
    
    metadata = {
        "name": normalized_name,
        "displayName": display_name,
        "description": description,
        "repository": repo_data.get('url') or '',
        "mcpConfig": mcp_config,
        "env": {}
    }
    
    with open(os.path.join(dest_folder, 'config.json'), 'w', encoding='utf-8') as f:
        json.dump(metadata, f, indent=2)
        
    print(f"Scraped {name} successfully.")
    return True

if __name__ == '__main__':
    links = get_registry_links()
    print(f"Found {len(links)} server links to scrape.")
    with ThreadPoolExecutor(max_workers=10) as executor:
        executor.map(process_server, links)
