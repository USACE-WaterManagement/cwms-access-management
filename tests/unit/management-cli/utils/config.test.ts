import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';

vi.mock('node:fs', () => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
  mkdirSync: vi.fn(),
}));

vi.mock('node:os', () => ({
  homedir: vi.fn(() => '/mock/home'),
}));

const CONFIG_DIR = '/mock/home/.cwms-swims-admin';
const CONFIG_FILE = '/mock/home/.cwms-swims-admin/config.json';

describe('config module', () => {
  let getConfig: typeof import('../../../../apps/cli/management-cli/src/utils/config').getConfig;
  let saveConfig: typeof import('../../../../apps/cli/management-cli/src/utils/config').saveConfig;
  let clearConfig: typeof import('../../../../apps/cli/management-cli/src/utils/config').clearConfig;

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();

    const configModule = await import('../../../../apps/cli/management-cli/src/utils/config');
    getConfig = configModule.getConfig;
    saveConfig = configModule.saveConfig;
    clearConfig = configModule.clearConfig;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getConfig', () => {
    it('returns empty object when config file does not exist', () => {
      vi.mocked(existsSync).mockReturnValue(false);

      const result = getConfig();

      expect(result).toEqual({});
      expect(existsSync).toHaveBeenCalledWith(CONFIG_FILE);
    });

    it('returns parsed config when file exists', () => {
      const mockConfig = {
        token: 'test-token',
        username: 'testuser',
        apiUrl: 'http://localhost:3002',
      };

      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFileSync).mockReturnValue(JSON.stringify(mockConfig));

      const result = getConfig();

      expect(result).toEqual(mockConfig);
      expect(readFileSync).toHaveBeenCalledWith(CONFIG_FILE, 'utf-8');
    });

    it('returns empty object on JSON parse error', () => {
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFileSync).mockReturnValue('invalid json');

      const result = getConfig();

      expect(result).toEqual({});
    });

    it('returns empty object on read error', () => {
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFileSync).mockImplementation(() => {
        throw new Error('Read error');
      });

      const result = getConfig();

      expect(result).toEqual({});
    });
  });

  describe('saveConfig', () => {
    it('creates config directory if it does not exist', () => {
      vi.mocked(existsSync).mockReturnValue(false);

      const config = { token: 'test-token' };
      saveConfig(config);

      expect(mkdirSync).toHaveBeenCalledWith(CONFIG_DIR, { recursive: true });
      expect(writeFileSync).toHaveBeenCalledWith(
        CONFIG_FILE,
        JSON.stringify(config, null, 2),
      );
    });

    it('throws on write error', () => {
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(writeFileSync).mockImplementation(() => {
        throw new Error('Write error');
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => saveConfig({ token: 'test' })).toThrow('Write error');
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('clearConfig', () => {
    it('writes empty object when config file exists', () => {
      vi.mocked(existsSync).mockReturnValue(true);

      clearConfig();

      expect(writeFileSync).toHaveBeenCalledWith(CONFIG_FILE, '{}');
    });

    it('does nothing when config file does not exist', () => {
      vi.mocked(existsSync).mockReturnValue(false);

      clearConfig();

      expect(writeFileSync).not.toHaveBeenCalled();
    });

    it('handles write error gracefully', () => {
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(writeFileSync).mockImplementation(() => {
        throw new Error('Write error');
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      clearConfig();

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});
