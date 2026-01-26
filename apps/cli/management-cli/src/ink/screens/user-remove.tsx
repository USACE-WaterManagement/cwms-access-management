import { Box, Text, useApp } from 'ink';
import { useEffect, useState } from 'react';
import prompts from 'prompts';

import { ApiService, type User } from '../../services/api.service';
import { logger } from '../../utils/logger';
import { toError } from '../../utils/error';
import { StatusMessage } from '../components/status-message';

interface RemoveUserScreenProps {
  userId: string;
  skipConfirm?: boolean;
}

type RemoveUserState =
  | { status: 'loading' }
  | { status: 'confirming'; user: User }
  | { status: 'removing'; user: User }
  | { status: 'success'; username: string }
  | { status: 'cancelled' }
  | { status: 'error'; error: Error };

export function RemoveUserScreen({ userId, skipConfirm }: RemoveUserScreenProps) {
  const { exit } = useApp();
  const [state, setState] = useState<RemoveUserState>({ status: 'loading' });

  useEffect(() => {
    if (state.status !== 'loading') return;

    let cancelled = false;

    (async () => {
      try {
        const apiService = new ApiService();
        const user = await apiService.getUser(userId);

        if (!cancelled) {
          setState({ status: 'confirming', user });
        }
      } catch (error) {
        const err = toError(error, `Failed to load user ${userId}`);
        logger.error({ error: err, userId }, 'Failed to load user');

        if (!cancelled) {
          setState({ status: 'error', error: err });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [state.status, userId]);

  useEffect(() => {
    if (state.status !== 'confirming') return;

    let cancelled = false;

    (async () => {
      try {
        let confirmed = skipConfirm || false;

        if (!skipConfirm) {
          const response = await prompts({
            type: 'confirm',
            name: 'confirmed',
            message: `Remove user "${state.user.username}" (${state.user.email || 'no email'})?`,
            initial: false,
          });

          confirmed = response.confirmed;
        }

        if (!cancelled) {
          if (confirmed) {
            setState({ status: 'removing', user: state.user });
          } else {
            setState({ status: 'cancelled' });
          }
        }
      } catch (error) {
        const err = toError(error, 'Confirmation failed');

        if (!cancelled) {
          setState({ status: 'error', error: err });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [state, skipConfirm]);

  useEffect(() => {
    if (state.status !== 'removing') return;

    let cancelled = false;

    (async () => {
      try {
        const apiService = new ApiService();
        await apiService.deleteUser(userId);

        if (!cancelled) {
          setState({ status: 'success', username: state.user.username });
        }
      } catch (error) {
        const err = toError(error, `Failed to remove user ${userId}`);
        logger.error({ error: err, userId }, 'Failed to remove user');

        if (!cancelled) {
          setState({ status: 'error', error: err });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [state, userId]);

  useEffect(() => {
    if (state.status === 'success' || state.status === 'cancelled' || state.status === 'error') {
      const timeout = setTimeout(() => {
        exit(state.status === 'error' ? state.error : undefined);
      }, 0);

      return () => clearTimeout(timeout);
    }

    return undefined;
  }, [state, exit]);

  if (state.status === 'loading') {
    return (
      <StatusMessage
        title={`Loading user ${userId}...`}
        color='cyan'
      />
    );
  }

  if (state.status === 'confirming') {
    return (
      <StatusMessage
        title='Waiting for confirmation...'
        color='yellow'
      />
    );
  }

  if (state.status === 'removing') {
    return (
      <StatusMessage
        title={`Removing user ${state.user.username}...`}
        color='cyan'
      />
    );
  }

  if (state.status === 'cancelled') {
    return (
      <StatusMessage
        title='Cancelled'
        detail='User not removed'
        color='yellow'
      />
    );
  }

  if (state.status === 'error') {
    return (
      <StatusMessage
        title='Failed to remove user'
        detail={state.error.message}
        color='red'
        emphasize
      />
    );
  }

  return (
    <Box flexDirection='column'>
      <StatusMessage
        title='✓ User removed successfully'
        color='green'
      />
      <Box marginTop={1}>
        <Text color='gray'>User "{state.username}" has been deleted</Text>
      </Box>
    </Box>
  );
}
