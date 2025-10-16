import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

let cachedVersion: string | null = null;

export function getVersion(): string {
  if (cachedVersion) {
    return cachedVersion;
  }

  try {
    // In development: relative to src/utils/version.ts at ../../package.json
    // In production: bundled index.js is in same folder as package.json at ./package.json
    const currentDir = dirname(fileURLToPath(import.meta.url));

    // Try production path first (same directory as bundled index.js)
    let packageJsonPath = join(currentDir, 'package.json');

    try {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      const version = packageJson.version || '0.0.0';
      cachedVersion = version;
      return version;
    } catch {
      // Fallback to development path (two levels up from src/utils/)
      packageJsonPath = join(currentDir, '../../package.json');
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      const version = packageJson.version || '0.0.0';
      cachedVersion = version;
      return version;
    }
  } catch (error) {
    return '0.0.0';
  }
}
