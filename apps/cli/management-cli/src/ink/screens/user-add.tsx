import { Box, useApp } from 'ink';
import { useEffect, useState } from 'react';
import prompts from 'prompts';
import { z } from 'zod';

import { ApiService, type User } from '../../services/api.service';
import { type CreateUserInput, createUserSchema } from '../../utils/validation';
import { logger } from '../../utils/logger';
import { toError } from '../../utils/error';
import { StatusMessage } from '../components/status-message';
import { DetailRow } from '../components/detail-row';


interface AddUserScreenProps {
  options: {
    username?: string;
    email?: string;
    password?: string;
    name?: string;
    disabled?: boolean;
  };
}

type AddUserState =
  | { status: 'collecting' }
  | { status: 'creating'; data: CreateUserInput }
  | { status: 'success'; user: User }
  | { status: 'error'; error: Error };

export function AddUserScreen({ options }: AddUserScreenProps) {
  const { exit } = useApp();
  const [state, setState] = useState<AddUserState>({ status: 'collecting' });

  useEffect(() => {
    if (state.status !== 'collecting') return;

    let cancelled = false;

    (async () => {
      try {
        const userData = await collectUserData(options);

        if (!cancelled) {
          setState({ status: 'creating', data: userData });
        }
      } catch (error) {
        const err = toError(error, 'Failed to collect user data');

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
        const user = await apiService.createUser(state.data);

        if (!cancelled) {
          setState({ status: 'success', user });
        }
      } catch (error) {
        const err = toError(error, 'Failed to create user');
        logger.error({ error: err }, 'Failed to create user');

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
        title='Collecting user information...'
        color='cyan'
      />
    );
  }

  if (state.status === 'creating') {
    return (
      <StatusMessage
        title={`Creating user ${state.data.username}...`}
        color='cyan'
      />
    );
  }

  if (state.status === 'error') {
    return (
      <StatusMessage
        title='Failed to create user'
        detail={state.error.message}
        color='red'
        emphasize
      />
    );
  }

  const { user } = state;

  return (
    <Box flexDirection='column'>
      <StatusMessage
        title='✓ User created successfully'
        color='green'
      />
      <Box
        marginTop={1}
        flexDirection='column'>
        <DetailRow
          label='Username'
          value={user.username}
          color='cyan'
        />
        <DetailRow
          label='ID'
          value={user.id}
          color='gray'
        />
        {user.email ? (
          <DetailRow
            label='Email'
            value={user.email}
          />
        ) : null}
        {user.firstName || user.lastName ? (
          <DetailRow
            label='Name'
            value={`${user.firstName || ''} ${user.lastName || ''}`.trim()}
          />
        ) : null}
        <DetailRow
          label='Status'
          value={user.enabled ? 'Enabled' : 'Disabled'}
          color={user.enabled ? 'green' : 'red'}
        />
      </Box>
    </Box>
  );
}

async function collectUserData(options: AddUserScreenProps['options']): Promise<CreateUserInput> {
  const zodValidate = (schema: z.ZodTypeAny) => (value: unknown) => {
    const result = schema.safeParse(value);
    return result.success ? true : (result.error.errors[0]?.message ?? 'Invalid value');
  };

  const assertValidFlag = (schema: z.ZodTypeAny, value: unknown) => {
    const result = schema.safeParse(value);
    if (!result.success) throw new Error(result.error.errors[0]?.message ?? 'Invalid value');
  };

  const questions: prompts.PromptObject<string>[] = [];

  if (!options.username) {
    questions.push({
      type: 'text',
      name: 'username',
      message: 'Username:',
      validate: zodValidate(createUserSchema.shape.username),
    });
  } else {
    assertValidFlag(createUserSchema.shape.username, options.username);
  }

  if (!options.email) {
    questions.push({
      type: 'text',
      name: 'email',
      message: 'Email:',
      validate: zodValidate(createUserSchema.shape.email),
    });
  } else {
    assertValidFlag(createUserSchema.shape.email, options.email);
  }

  if (!options.password) {
    questions.push({
      type: 'password',
      name: 'password',
      message: 'Password:',
      validate: zodValidate(createUserSchema.shape.password),
    });
  } else {
    assertValidFlag(createUserSchema.shape.password, options.password);
  }

  if (!options.name) {
    questions.push({
      type: 'text',
      name: 'name',
      message: 'Full name:',
      validate: zodValidate(createUserSchema.shape.name),
    });
  } else {
    assertValidFlag(createUserSchema.shape.name, options.name);
  }

  const answers = questions.length > 0 ? await prompts(questions) : {};

  // Check for cancelled prompt (Ctrl+C)
  if (Object.keys(answers).length < questions.length) {
    throw new Error('User cancelled');
  }

  return {
    username: options.username || answers.username,
    email: options.email || answers.email,
    password: options.password || answers.password,
    name: options.name || answers.name,
    enabled: !options.disabled,
  };
}
