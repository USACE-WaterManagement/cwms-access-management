import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

interface Config {
  token?: string;
  username?: string;
  apiUrl?: string;
}

const CONFIG_DIR = join(homedir(), '.cwms-admin');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

export function getConfig(): Config {
  try {
    if (!existsSync(CONFIG_FILE)) {
      return {};
    }

    const data = readFileSync(CONFIG_FILE, 'utf-8');

    return JSON.parse(data);
  } catch (error) {
    return {};
  }
}

export function saveConfig(config: Config): void {
  try {
    if (!existsSync(CONFIG_DIR)) {
      mkdirSync(CONFIG_DIR, { recursive: true });
    }

    writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
  } catch (error) {
    console.error('Failed to save configuration:', error);
    throw error;
  }
}

export function clearConfig(): void {
  try {
    if (existsSync(CONFIG_FILE)) {
      writeFileSync(CONFIG_FILE, '{}');
    }
  } catch (error) {
    console.error('Failed to clear configuration:', error);
  }
}
