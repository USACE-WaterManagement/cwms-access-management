import { config, TestUser } from '../setup/config.js';
import { testLogger } from './logger.js';

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

const tokenCache: Map<string, { token: string; expiresAt: number }> = new Map();

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getToken(user: TestUser): Promise<string> {
  const userConfig = config.testUsers[user];
  const cacheKey = userConfig.username;

  const cached = tokenCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.token;
  }

  const tokenUrl = `${config.keycloak.url}/auth/realms/${config.keycloak.realm}/protocol/openid-connect/token`;

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          username: userConfig.username,
          password: userConfig.password,
          grant_type: 'password',
          client_id: config.keycloak.clientId,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Failed to get token for ${userConfig.username}: ${response.status} ${text}`);
      }

      const data: TokenResponse = await response.json();

      tokenCache.set(cacheKey, {
        token: data.access_token,
        expiresAt: Date.now() + (data.expires_in - 60) * 1000,
      });

      return data.access_token;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < MAX_RETRIES) {
        const delay = RETRY_DELAY_MS * attempt;
        testLogger.warn(`Token request failed (attempt ${attempt}/${MAX_RETRIES}), retrying in ${delay}ms: ${lastError.message}`);
        await sleep(delay);
      }
    }
  }

  throw lastError ?? new Error(`Failed to get token for ${cacheKey} after ${MAX_RETRIES} attempts`);
}

export function clearTokenCache(): void {
  tokenCache.clear();
}
