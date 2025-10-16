import { Box, Text, useApp } from 'ink';
import { useEffect, useState, type ComponentProps } from 'react';

import { ApiService, type User } from '../../services/api.service';
import { logger } from '../../utils/logger';
import { toError } from '../../utils/error';
import { StatusMessage } from '../components/status-message';

const apiService = new ApiService();

interface UserDetailsScreenProps {
  userId: string;
}

type UserDetailsState =
  | { status: 'loading' }
  | { status: 'success'; user: User }
  | { status: 'error'; error: Error };

const LABEL_WIDTH = 12;

export function UserDetailsScreen({ userId }: UserDetailsScreenProps) {
  const { exit } = useApp();
  const [state, setState] = useState<UserDetailsState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const user = await apiService.getUser(userId);

        if (!cancelled) {
          setState({ status: 'success', user });
        }
      } catch (error) {
        const resolvedError = toError(error, `Failed to load user ${userId}`);
        logger.error({ error: resolvedError, userId }, 'Failed to load user');

        if (!cancelled) {
          setState({ status: 'error', error: resolvedError });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

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
    return <StatusMessage title={`Loading user ${userId}...`} color="cyan" />;
  }

  if (state.status === 'error') {
    return (
      <StatusMessage
        title="Failed to load user"
        detail={state.error.message}
        color="red"
        emphasize
      />
    );
  }

  const { user } = state;

  return (
    <Box flexDirection="column">
      <Text bold>User Details</Text>
      <Box marginTop={1} flexDirection="column">
        <DetailRow label="Username" value={user.username} color="cyan" />
        <DetailRow label="ID" value={user.id} color="gray" />
        {user.email ? <DetailRow label="Email" value={user.email} /> : null}
        {user.firstName ? <DetailRow label="First Name" value={user.firstName} /> : null}
        {user.lastName ? <DetailRow label="Last Name" value={user.lastName} /> : null}
        <DetailRow
          label="Status"
          value={user.enabled ? 'Enabled' : 'Disabled'}
          color={user.enabled ? 'green' : 'red'}
        />
      </Box>
    </Box>
  );
}

function DetailRow({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: ComponentProps<typeof Text>['color'];
}) {
  return (
    <Box>
      <Text bold>{`${label.padEnd(LABEL_WIDTH)}:`}</Text>
      <Text color={color}>
        {' '}
        {value}
      </Text>
    </Box>
  );
}
