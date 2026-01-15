import { Box, Text, useApp } from 'ink';
import { type ComponentProps, useEffect, useState } from 'react';
import prompts from 'prompts';

import { ApiService, type Role } from '../../services/api.service';
import { logger } from '../../utils/logger';
import { toError } from '../../utils/error';
import { StatusMessage } from '../components/status-message';

interface RemoveRoleScreenProps {
  roleId: string;
  skipConfirm?: boolean;
}

type RemoveRoleState =
  | { status: 'loading' }
  | { status: 'confirming'; role: Role }
  | { status: 'removing'; role: Role }
  | { status: 'success'; role: Role }
  | { status: 'cancelled' }
  | { status: 'error'; error: Error };

const LABEL_WIDTH = 12;

export function RemoveRoleScreen({ roleId, skipConfirm }: RemoveRoleScreenProps) {
  const { exit } = useApp();
  const [state, setState] = useState<RemoveRoleState>({ status: 'loading' });

  // Step 1: Load role details
  useEffect(() => {
    if (state.status !== 'loading') return;

    let cancelled = false;

    (async () => {
      try {
        const apiService = new ApiService();
        const role = await apiService.getRole(roleId);

        if (!cancelled) {
          setState({ status: 'confirming', role });
        }
      } catch (error) {
        const err = toError(error, 'Failed to load role');
        logger.error({ error: err }, 'Failed to load role');

        if (!cancelled) {
          setState({ status: 'error', error: err });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [state.status, roleId]);

  // Step 2: Confirm deletion (unless skipped)
  useEffect(() => {
    if (state.status !== 'confirming') return;

    let cancelled = false;

    (async () => {
      try {
        // Skip confirmation if --yes flag was passed
        if (skipConfirm) {
          if (!cancelled) {
            setState({ status: 'removing', role: state.role });
          }

          return;
        }

        // Prompt for confirmation
        const answer = await prompts({
          type: 'confirm',
          name: 'confirmed',
          message: `Delete role "${state.role.name}" (${state.role.id})?`,
          initial: false,
        });

        if (!cancelled) {
          if (answer.confirmed) {
            setState({ status: 'removing', role: state.role });
          } else {
            setState({ status: 'cancelled' });
          }
        }
      } catch (error) {
        const err = toError(error, 'Failed to confirm deletion');

        if (!cancelled) {
          setState({ status: 'error', error: err });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [state, skipConfirm]);

  // Step 3: Delete role
  useEffect(() => {
    if (state.status !== 'removing') return;

    let cancelled = false;

    (async () => {
      try {
        const apiService = new ApiService();
        await apiService.deleteRole(state.role.id);

        if (!cancelled) {
          setState({ status: 'success', role: state.role });
        }
      } catch (error) {
        const err = toError(error, 'Failed to delete role');
        logger.error({ error: err }, 'Failed to delete role');

        if (!cancelled) {
          setState({ status: 'error', error: err });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [state]);

  // Step 4: Exit on completion
  useEffect(() => {
    if (state.status === 'success' || state.status === 'error' || state.status === 'cancelled') {
      const timeout = setTimeout(() => {
        exit(state.status === 'error' ? state.error : undefined);
      }, 0);

      return () => clearTimeout(timeout);
    }

    return undefined;
  }, [state, exit]);

  // Render based on state
  if (state.status === 'loading') {
    return (
      <StatusMessage
        title='Loading role...'
        color='cyan'
      />
    );
  }

  if (state.status === 'confirming') {
    return (
      <StatusMessage
        title='Waiting for confirmation...'
        color='cyan'
      />
    );
  }

  if (state.status === 'removing') {
    return (
      <StatusMessage
        title={`Deleting role ${state.role.name}...`}
        color='cyan'
      />
    );
  }

  if (state.status === 'cancelled') {
    return (
      <StatusMessage
        title='Role deletion cancelled'
        color='yellow'
      />
    );
  }

  if (state.status === 'error') {
    return (
      <StatusMessage
        title='Failed to delete role'
        detail={state.error.message}
        color='red'
        emphasize
      />
    );
  }

  // Success - show deleted role details
  const { role } = state;

  return (
    <Box flexDirection='column'>
      <StatusMessage
        title='✓ Role deleted successfully'
        color='green'
      />
      <Box
        marginTop={1}
        flexDirection='column'>
        <DetailRow
          label='Name'
          value={role.name}
          color='cyan'
        />
        <DetailRow
          label='ID'
          value={role.id}
          color='gray'
        />
        {role.description ? (
          <DetailRow
            label='Description'
            value={role.description}
          />
        ) : null}
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
      <Text color={color}> {value}</Text>
    </Box>
  );
}
