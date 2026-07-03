import fs from 'fs';
import path from 'path';

// Centralized version source — read from package.json
let _version: string | undefined;

function getVersion(): string {
  if (_version !== undefined) return _version;
  try {
    // Try multiple locations for both dev and bundled environments
    const candidates = [
      path.resolve(__dirname, '..', 'package.json'),
      path.resolve(__dirname, '..', '..', 'package.json'),
    ];
    for (const pkgPath of candidates) {
      if (fs.existsSync(pkgPath)) {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
        if (pkg.version) {
          _version = pkg.version as string;
          return _version;
        }
      }
    }
  } catch {
    // ignore
  }
  _version = '1.2.0'; // fallback
  return _version;
}

export const CLI_VERSION = getVersion();