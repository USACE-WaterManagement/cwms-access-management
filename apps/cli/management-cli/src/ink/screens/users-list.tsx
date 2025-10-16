import { Box, Text, useApp } from 'ink';
import { useEffect, useState } from 'react';

import { ApiService, type User } from '../../services/api.service';
import { logger } from '../../utils/logger';
import { toError } from '../../utils/error';
import { StatusMessage } from '../components/status-message';
import { Table, type CellProps } from '../components/ink-table';

const apiService = new ApiService();

type UsersState =
  | { status: 'loading' }
  | { status: 'success'; users: User[] }
  | { status: 'error'; error: Error };

export function UsersListScreen() {
  const { exit } = useApp();
  const [state, setState] = useState<UsersState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const users = await apiService.getUsers();

        if (!cancelled) {
          setState({ status: 'success', users });
        }
      } catch (error) {
        const resolvedError = toError(error, 'Failed to load users');
        logger.error({ error: resolvedError }, 'Failed to load users');

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
    return <StatusMessage title="Loading users..." color="cyan" />;
  }

  if (state.status === 'error') {
    return (
      <StatusMessage
        title="Failed to load users"
        detail={state.error.message}
        color="red"
        emphasize
      />
    );
  }

  if (state.users.length === 0) {
    return <StatusMessage title="No users found" color="yellow" />;
  }

  const tableData = state.users.map((user) => ({
    Username: user.username,
    ID: user.id,
    Email: user.email ?? '-',
    Name: formatFullName(user),
    Status: user.enabled ? 'Enabled' : 'Disabled',
  }));

  const customCell = (props: CellProps) => {
    const value = String(props.children).trim();

    if (value === 'Enabled') {
      return <Text color="green">{props.children}</Text>;
    }

    if (value === 'Disabled') {
      return <Text color="red">{props.children}</Text>;
    }

    return <Text>{props.children}</Text>;
  };

  return (
    <Box flexDirection="column">
      <Text bold>{`Found ${state.users.length} users`}</Text>
      <Box marginTop={1}>
        <Table data={tableData} cell={customCell} />
      </Box>
    </Box>
  );
}

function formatFullName(user: User): string {
  const name = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();

  return name.length > 0 ? name : '-';
}
