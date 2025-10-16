import { Box, Text, useApp } from 'ink';
import { useEffect, useState, type ComponentProps } from 'react';

import { ApiService, type Role } from '../../services/api.service';
import { logger } from '../../utils/logger';
import { toError } from '../../utils/error';
import { StatusMessage } from '../components/status-message';

const apiService = new ApiService();

interface RoleDetailsScreenProps {
  roleId: string;
}

type RoleDetailsState =
  | { status: 'loading' }
  | { status: 'success'; role: Role }
  | { status: 'error'; error: Error };

const LABEL_WIDTH = 12;

export function RoleDetailsScreen({ roleId }: RoleDetailsScreenProps) {
  const { exit } = useApp();
  const [state, setState] = useState<RoleDetailsState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const role = await apiService.getRole(roleId);

        if (!cancelled) {
          setState({ status: 'success', role });
        }
      } catch (error) {
        const resolvedError = toError(error, `Failed to load role ${roleId}`);
        logger.error({ error: resolvedError, roleId }, 'Failed to load role');

        if (!cancelled) {
          setState({ status: 'error', error: resolvedError });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [roleId]);

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
    return <StatusMessage title={`Loading role ${roleId}...`} color="cyan" />;
  }

  if (state.status === 'error') {
    return (
      <StatusMessage
        title="Failed to load role"
        detail={state.error.message}
        color="red"
        emphasize
      />
    );
  }

  const { role } = state;

  return (
    <Box flexDirection="column">
      <Text bold>Role Details</Text>
      <Box marginTop={1} flexDirection="column">
        <DetailRow label="Name" value={role.name} color="cyan" />
        <DetailRow label="ID" value={role.id} color="gray" />
        {role.description ? <DetailRow label="Description" value={role.description} /> : null}
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
