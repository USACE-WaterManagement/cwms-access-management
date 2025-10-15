import { readFileSync } from 'fs';
import { join } from 'path';

let cachedVersion: string | null = null;

export function getVersion(): string {
  if (cachedVersion) {
    return cachedVersion;
  }

  try {
    const packageJsonPath = join(__dirname, '../../../../package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    const version = packageJson.version || '0.0.0';
    cachedVersion = version;

    return version;
  } catch (error) {
    console.error('Failed to read version from package.json:', error);

    return '0.0.0';
  }
}
