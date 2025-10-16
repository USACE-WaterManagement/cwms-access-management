import { Box, Text, useApp } from 'ink';
import { useEffect, useState } from 'react';

import { ApiService, type Policy } from '../../services/api.service';
import { logger } from '../../utils/logger';
import { toError } from '../../utils/error';
import { Table } from '../components/ink-table';
import { StatusMessage } from '../components/status-message';

const apiService = new ApiService();

type PoliciesState =
  | { status: 'loading' }
  | { status: 'success'; policies: Policy[] }
  | { status: 'error'; error: Error };

export function PoliciesListScreen() {
  const { exit } = useApp();
  const [state, setState] = useState<PoliciesState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const policies = await apiService.getPolicies();

        if (!cancelled) {
          setState({ status: 'success', policies });
        }
      } catch (error) {
        const resolvedError = toError(error, 'Failed to load policies');
        logger.error({ error: resolvedError }, 'Failed to load policies');

        if (!cancelled) {
          setState({ status: 'error', error: resolvedError });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (state.status === 'success') {
      const timeout = setTimeout(() => exit(), 0);

      return () => clearTimeout(timeout);
    }

    if (state.status === 'error') {
      const timeout = setTimeout(() => exit(state.error), 0);

      return () => clearTimeout(timeout);
    }

    return undefined;
  }, [state, exit]);

  if (state.status === 'loading') {
    return <StatusMessage title="Loading policies..." color="cyan" />;
  }

  if (state.status === 'error') {
    return (
      <StatusMessage
        title="Failed to load policies"
        detail={state.error.message}
        color="red"
        emphasize
      />
    );
  }

  if (state.policies.length === 0) {
    return <StatusMessage title="No policies found" color="yellow" />;
  }

  const tableData = state.policies.map((policy) => ({
    Name: policy.name,
    ID: policy.id,
    Description: policy.description ?? '-',
  }));

  return (
    <Box flexDirection="column">
      <Text bold>{`Found ${state.policies.length} policies`}</Text>
      <Box marginTop={1}>
        <Table data={tableData} />
      </Box>
    </Box>
  );
}
