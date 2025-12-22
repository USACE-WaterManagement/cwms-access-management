import { FastifyInstance } from 'fastify';
import { createClient, RedisClientType } from 'redis';

import { User } from '../types/authorization';
import { getConfig } from '../config';

export class CacheService {
  private client: RedisClientType | null = null;
  private config: ReturnType<typeof getConfig>;
  private readonly TTL_SECONDS = 30 * 60;

  constructor(private fastify: FastifyInstance) {
    this.config = getConfig(fastify);
  }

  async initialize(): Promise<void> {
    try {
      this.fastify.log.info('Initializing Redis cache connection');

      this.client = createClient({
        url: this.config.REDIS_URL || 'redis://localhost:6379',
      });

      this.client.on('error', (err) => {
        this.fastify.log.error({ error: err }, 'Redis client error');
      });

      this.client.on('connect', () => {
        this.fastify.log.info('Redis client connected');
      });

      await this.client.connect();

      this.fastify.log.info('Redis cache connection established');
    } catch (error) {
      this.fastify.log.error({ error }, 'Failed to initialize Redis cache');
      throw error;
    }
  }

  async close(): Promise<void> {
    if (this.client) {
      try {
        await this.client.quit();
        this.fastify.log.info('Redis cache connection closed');
      } catch (error) {
        this.fastify.log.error({ error }, 'Error closing Redis connection');
      }
    }
  }

  async getUserContext(username: string): Promise<User | null> {
    if (!this.client) {
      return null;
    }

    try {
      const cacheKey = this.buildCacheKey(username);
      const cached = await this.client.get(cacheKey);

      if (cached) {
        this.fastify.log.debug({ username, cacheKey }, 'User context found in cache');
        return JSON.parse(cached) as User;
      }

      this.fastify.log.debug({ username, cacheKey }, 'User context not found in cache');
      return null;
    } catch (error) {
      this.fastify.log.error({ error, username }, 'Error retrieving user context from cache');
      return null;
    }
  }

  async setUserContext(username: string, user: User): Promise<void> {
    if (!this.client) {
      return;
    }

    try {
      const cacheKey = this.buildCacheKey(username);
      await this.client.setEx(cacheKey, this.TTL_SECONDS, JSON.stringify(user));

      this.fastify.log.debug(
        {
          username,
          cacheKey,
          ttl: this.TTL_SECONDS,
        },
        'User context stored in cache',
      );
    } catch (error) {
      this.fastify.log.error({ error, username }, 'Error storing user context in cache');
    }
  }

  async invalidateUserContext(username: string): Promise<void> {
    if (!this.client) {
      return;
    }

    try {
      const cacheKey = this.buildCacheKey(username);
      await this.client.del(cacheKey);

      this.fastify.log.debug({ username, cacheKey }, 'User context invalidated from cache');
    } catch (error) {
      this.fastify.log.error({ error, username }, 'Error invalidating user context from cache');
    }
  }

  async healthCheck(): Promise<boolean> {
    if (!this.client) {
      return false;
    }

    try {
      await this.client.ping();
      return true;
    } catch (error) {
      this.fastify.log.error({ error }, 'Redis health check failed');
      return false;
    }
  }

  private buildCacheKey(username: string): string {
    return `user:context:${username.toLowerCase()}`;
  }
}
