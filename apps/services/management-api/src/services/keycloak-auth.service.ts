import axios from 'axios';
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

import { logger } from '../utils/logger.js';

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  refresh_expires_in: number;
  token_type: string;
}

interface DecodedToken {
  exp: number;
  iat: number;
  sub: string;
  preferred_username: string;
  email?: string;
  realm_access?: {
    roles: string[];
  };
}

export class KeycloakAuthService {
  private keycloakUrl: string;
  private issuerUrl: string;
  private realm: string;
  private clientId: string;
  private jwksClient: jwksClient.JwksClient;

  constructor(keycloakUrl: string, realm: string = 'cwms', clientId: string = 'cwms', issuerUrl?: string) {
    this.keycloakUrl = keycloakUrl;
    this.issuerUrl = issuerUrl || keycloakUrl;
    this.realm = realm;
    this.clientId = clientId;

    this.jwksClient = jwksClient({
      jwksUri: `${keycloakUrl}/realms/${realm}/protocol/openid-connect/certs`,
      cache: true,
      cacheMaxAge: 600000,
      rateLimit: true,
    });
  }

  async login(username: string, password: string): Promise<TokenResponse> {
    try {
      const response = await axios.post<TokenResponse>(
        `${this.keycloakUrl}/realms/${this.realm}/protocol/openid-connect/token`,
        new URLSearchParams({
          username,
          password,
          grant_type: 'password',
          client_id: this.clientId,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      logger.info({ username }, 'User logged in via Keycloak');
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        throw new Error('Invalid credentials');
      }
      logger.error({ error, username }, 'Login failed');
      throw new Error('Authentication failed');
    }
  }

  async logout(refreshToken: string): Promise<void> {
    try {
      await axios.post(
        `${this.keycloakUrl}/realms/${this.realm}/protocol/openid-connect/logout`,
        new URLSearchParams({
          refresh_token: refreshToken,
          client_id: this.clientId,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      logger.info('User logged out via Keycloak');
    } catch (error) {
      logger.error({ error }, 'Logout failed');
      throw new Error('Logout failed');
    }
  }

  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    try {
      const response = await axios.post<TokenResponse>(
        `${this.keycloakUrl}/realms/${this.realm}/protocol/openid-connect/token`,
        new URLSearchParams({
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
          client_id: this.clientId,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      return response.data;
    } catch (error) {
      logger.error({ error }, 'Token refresh failed');
      throw new Error('Token refresh failed');
    }
  }

  private getSigningKey(kid: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.jwksClient.getSigningKey(kid, (err, key) => {
        if (err) {
          reject(err);
          return;
        }
        if (!key) {
          reject(new Error('Signing key not found'));
          return;
        }
        const signingKey = key.getPublicKey();
        resolve(signingKey);
      });
    });
  }

  async validateToken(token: string): Promise<DecodedToken> {
    try {
      const decoded = jwt.decode(token, { complete: true });

      if (!decoded || !decoded.header.kid) {
        throw new Error('Invalid token format');
      }

      const publicKey = await this.getSigningKey(decoded.header.kid);

      const verified = jwt.verify(token, publicKey, {
        algorithms: ['RS256'],
        issuer: `${this.issuerUrl}/realms/${this.realm}`,
      }) as DecodedToken;

      return verified;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Token expired');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid token');
      }
      logger.error({ error }, 'Token validation failed');
      throw new Error('Token validation failed');
    }
  }

  async introspectToken(token: string): Promise<boolean> {
    try {
      const response = await axios.post(
        `${this.keycloakUrl}/realms/${this.realm}/protocol/openid-connect/token/introspect`,
        new URLSearchParams({
          token,
          client_id: this.clientId,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      return response.data.active === true;
    } catch (error) {
      logger.error({ error }, 'Token introspection failed');
      return false;
    }
  }
}
