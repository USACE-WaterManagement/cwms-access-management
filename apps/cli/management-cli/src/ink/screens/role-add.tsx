import { Box, Text, useApp } from 'ink';
import { type ComponentProps, useEffect, useState } from 'react';
import prompts from 'prompts';
import { z } from 'zod';

import { ApiService, type Role } from '../../services/api.service';
import { toError } from '../../utils/error';
import { logger } from '../../utils/logger';
import type { CreateRoleInput } from '../../utils/validation';
import { createRoleSchema } from '../../utils/validation';
import { StatusMessage } from '../components/status-message';

interface AddRoleScreenProps {
  options: {
    name?: string;
    description?: string;
  };
}

type AddRoleState =
  | { status: 'collecting' }
  | { status: 'creating'; data: CreateRoleInput }
  | { status: 'success'; role: Role }
  | { status: 'error'; error: Error };

const LABEL_WIDTH = 12;

export function AddRoleScreen({ options }: AddRoleScreenProps) {
  const { exit } = useApp();
  const [state, setState] = useState<AddRoleState>({ status: 'collecting' });

  useEffect(() => {
    if (state.status !== 'collecting') return;

    let cancelled = false;

    (async () => {
      try {
        const roleData = await collectRoleData(options);

        if (!cancelled) {
          setState({ status: 'creating', data: roleData });
        }
      } catch (error) {
        const err = toError(error, 'Failed to collect role data');

        if (!cancelled) {
          setState({ status: 'error', error: err });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [state.status, options]);

  useEffect(() => {
    if (state.status !== 'creating') return;

    let cancelled = false;

    (async () => {
      try {
        const apiService = new ApiService();
        const role = await apiService.createRole(state.data);

        if (!cancelled) {
          setState({ status: 'success', role });
        }
      } catch (error) {
        const err = toError(error, 'Failed to create role');
        logger.error({ error: err }, 'Failed to create role');

        if (!cancelled) {
          setState({ status: 'error', error: err });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [state]);

  useEffect(() => {
    if (state.status === 'success' || state.status === 'error') {
      const timeout = setTimeout(() => {
        exit(state.status === 'error' ? state.error : undefined);
      }, 0);

      return () => clearTimeout(timeout);
    }

    return undefined;
  }, [state, exit]);

  if (state.status === 'collecting') {
    return (
      <StatusMessage
        title='Collecting role information...'
        color='cyan'
      />
    );
  }

  if (state.status === 'creating') {
    return (
      <StatusMessage
        title={`Creating role ${state.data.name}...`}
        color='cyan'
      />
    );
  }

  if (state.status === 'error') {
    return (
      <StatusMessage
        title='Failed to create role'
        detail={state.error.message}
        color='red'
        emphasize
      />
    );
  }

  const { role } = state;

  return (
    <Box flexDirection='column'>
      <StatusMessage
        title='✓ Role created successfully'
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

async function collectRoleData(options: AddRoleScreenProps['options']): Promise<CreateRoleInput> {
  const zodValidate = (schema: z.ZodTypeAny) => (value: unknown) => {
    const result = schema.safeParse(value);
    return result.success ? true : (result.error.errors[0]?.message ?? 'Invalid value');
  };

  const assertValidFlag = (schema: z.ZodTypeAny, value: unknown) => {
    const result = schema.safeParse(value);
    if (!result.success) throw new Error(result.error.errors[0]?.message ?? 'Invalid value');
  };

  const questions: prompts.PromptObject<string>[] = [];

  if (!options.name) {
    questions.push({
      type: 'text',
      name: 'name',
      message: 'Role name (snake_case):',
      validate: zodValidate(createRoleSchema.shape.name),
    });
  } else {
    assertValidFlag(createRoleSchema.shape.name, options.name);
  }

  if (!options.description) {
    questions.push({
      type: 'text',
      name: 'description',
      message: 'Description (optional):',
      validate: zodValidate(createRoleSchema.shape.description),
    });
  } else {
    assertValidFlag(createRoleSchema.shape.description, options.description);
  }

  const answers = questions.length > 0 ? await prompts(questions) : {};

  if (Object.keys(answers).length < questions.length) {
    throw new Error('User cancelled');
  }

  return {
    name: options.name || answers.name,
    description: options.description ?? answers.description,
  };
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
