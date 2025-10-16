import { Box, Text, useApp } from 'ink';
import { useEffect, useMemo, useState, type ComponentProps } from 'react';

import { ApiService, type Policy } from '../../services/api.service';
import { logger } from '../../utils/logger';
import { toError } from '../../utils/error';
import { StatusMessage } from '../components/status-message';

const apiService = new ApiService();

interface PolicyDetailsScreenProps {
  policyId: string;
}

type PolicyDetailsState =
  | { status: 'loading' }
  | { status: 'success'; policy: Policy }
  | { status: 'error'; error: Error };

const LABEL_WIDTH = 12;

export function PolicyDetailsScreen({ policyId }: PolicyDetailsScreenProps) {
  const { exit } = useApp();
  const [state, setState] = useState<PolicyDetailsState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const policy = await apiService.getPolicy(policyId);

        if (!cancelled) {
          setState({ status: 'success', policy });
        }
      } catch (error) {
        const resolvedError = toError(error, `Failed to load policy ${policyId}`);
        logger.error({ error: resolvedError, policyId }, 'Failed to load policy');

        if (!cancelled) {
          setState({ status: 'error', error: resolvedError });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [policyId]);

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

  const formattedRules = useMemo(() => {
    if (state.status !== 'success') {
      return [] as string[];
    }

    try {
      return JSON.stringify(state.policy.rules, null, 2)
        .split('\n')
        .map((line) => line.trimEnd());
    } catch (error) {
      logger.error({ error }, 'Failed to format policy rules');

      return ['<unable to format rules>'];
    }
  }, [state]);

  if (state.status === 'loading') {
    return <StatusMessage title={`Loading policy ${policyId}...`} color="cyan" />;
  }

  if (state.status === 'error') {
    return (
      <StatusMessage
        title="Failed to load policy"
        detail={state.error.message}
        color="red"
        emphasize
      />
    );
  }

  const { policy } = state;

  return (
    <Box flexDirection="column">
      <Text bold>Policy Details</Text>
      <Box marginTop={1} flexDirection="column">
        <DetailRow label="Name" value={policy.name} color="cyan" />
        <DetailRow label="ID" value={policy.id} color="gray" />
        {policy.description ? <DetailRow label="Description" value={policy.description} /> : null}
      </Box>
      <Box marginTop={1} flexDirection="column">
        <Text bold>Rules</Text>
        <Box marginTop={1} flexDirection="column">
          {formattedRules.map((line, index) => (
            <Text key={index} color="gray">
              {line}
            </Text>
          ))}
        </Box>
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
