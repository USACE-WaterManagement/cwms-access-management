import axios from 'axios';

import { logger } from '../utils/logger.js';
import type { Policy } from '../types/index.js';

export class OpaService {
  private opaUrl: string;

  constructor(opaUrl: string) {
    this.opaUrl = opaUrl;
  }

  async getPolicies(): Promise<Policy[]> {
    try {
      const response = await axios.get(`${this.opaUrl}/v1/policies`);
      const policies = (response.data.result || []).map((policy: Policy) => ({
        id: policy.id,
        name: policy.id,
        description: `Policy: ${policy.id}`,
        rules: policy,
      }));

      return policies;
    } catch (error) {
      logger.error({ error }, 'Failed to fetch policies from OPA');

      throw new Error('Failed to fetch policies');
    }
  }

  async getPolicy(id: string): Promise<Policy | null> {
    try {
      const response = await axios.get(`${this.opaUrl}/v1/policies/${id}`);

      if (!response.data.result) {
        return null;
      }

      return {
        id,
        name: id,
        description: `Policy: ${id}`,
        rules: response.data.result,
      };
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      logger.error({ error, id }, 'Failed to fetch policy from OPA');

      throw new Error('Failed to fetch policy');
    }
  }

  async evaluatePolicy(input: unknown): Promise<boolean> {
    try {
      const response = await axios.post(
        `${this.opaUrl}/v1/data/cwms/authz/allow`,
        {
          input,
        },
      );

      return response.data.result === true;
    } catch (error) {
      logger.error({ error }, 'Failed to evaluate policy');

      throw new Error('Failed to evaluate policy');
    }
  }
}
