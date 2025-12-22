import { FastifyInstance } from 'fastify';
import fastifyEnv from '@fastify/env';

// Environment variable schema
const schema = {
  type: 'object',
  required: ['PORT', 'CWMS_API_URL'],
  properties: {
    PORT: {
      type: 'string',
      default: '3001',
    },
    HOST: {
      type: 'string',
      default: '0.0.0.0',
    },
    LOG_LEVEL: {
      type: 'string',
      default: 'info',
    },
    CWMS_API_URL: {
      type: 'string',
      default: 'http://localhost:7001/cwms-data',
    },
    CWMS_API_TIMEOUT: {
      type: 'string',
      default: '30000',
    },
    OPA_URL: {
      type: 'string',
      default: 'http://localhost:8181',
    },
    OPA_POLICY_PATH: {
      type: 'string',
      default: '/v1/data/cwms/authorize',
    },
    BYPASS_AUTH: {
      type: 'string',
      default: 'false',
    },
    CACHE_TTL_SECONDS: {
      type: 'string',
      default: '300',
    },
    CACHE_MAX_SIZE: {
      type: 'string',
      default: '1000',
    },
    OPA_WHITELIST_ENDPOINTS: {
      type: 'string',
      default: '["/cwms-data/timeseries","/cwms-data/offices"]',
    },
    CWMS_API_KEY: {
      type: 'string',
      default: '',
    },
    REDIS_URL: {
      type: 'string',
      default: 'redis://localhost:6379',
    },
  },
};

export interface Config {
  PORT: string;
  HOST: string;
  LOG_LEVEL: string;
  CWMS_API_URL: string;
  CWMS_API_TIMEOUT: string;
  OPA_URL: string;
  OPA_POLICY_PATH: string;
  BYPASS_AUTH: string;
  CACHE_TTL_SECONDS: string;
  CACHE_MAX_SIZE: string;
  OPA_WHITELIST_ENDPOINTS: string;
  CWMS_API_KEY: string;
  REDIS_URL: string;
}

export async function registerConfig(fastify: FastifyInstance): Promise<void> {
  await fastify.register(fastifyEnv, {
    schema,
    dotenv: true,
  });
}

export function getConfig(fastify: FastifyInstance): Config {
  return fastify.getEnvs<Config>();
}
