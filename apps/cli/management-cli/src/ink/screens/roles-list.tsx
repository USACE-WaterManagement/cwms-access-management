import { Box, Text, useApp } from 'ink';
import { useEffect, useState } from 'react';

import { ApiService, type Role } from '../../services/api.service';
import { logger } from '../../utils/logger';
import { toError } from '../../utils/error';
import { Table } from '../components/ink-table';
import { StatusMessage } from '../components/status-message';

const apiService = new ApiService();

type RolesState =
  | { status: 'loading' }
  | { status: 'success'; roles: Role[] }
  | { status: 'error'; error: Error };

export function RolesListScreen() {
  const { exit } = useApp();
  const [state, setState] = useState<RolesState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const roles = await apiService.getRoles();

        if (!cancelled) {
          setState({ status: 'success', roles });
        }
      } catch (error) {
        const resolvedError = toError(error, 'Failed to load roles');
        logger.error({ error: resolvedError }, 'Failed to load roles');

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
    return <StatusMessage title="Loading roles..." color="cyan" />;
  }

  if (state.status === 'error') {
    return (
      <StatusMessage
        title="Failed to load roles"
        detail={state.error.message}
        color="red"
        emphasize
      />
    );
  }

  if (state.roles.length === 0) {
    return <StatusMessage title="No roles found" color="yellow" />;
  }

  const tableData = state.roles.map((role) => ({
    Name: role.name,
    ID: role.id,
    Description: role.description ?? '-',
  }));

  return (
    <Box flexDirection="column">
      <Text bold>{`Found ${state.roles.length} roles`}</Text>
      <Box marginTop={1}>
        <Table data={tableData} />
      </Box>
    </Box>
  );
}
