import { Box, Text } from 'ink';
import type { ComponentProps } from 'react';

interface StatusMessageProps {
  title: string;
  detail?: string;
  color?: ComponentProps<typeof Text>['color'];
  emphasize?: boolean;
}

export function StatusMessage({ title, detail, color = 'white', emphasize = false }: StatusMessageProps) {
  return (
    <Box flexDirection="column">
      <Text color={color} bold={emphasize}>
        {title}
      </Text>
      {detail ? (
        <Text color={color}>
          {detail}
        </Text>
      ) : null}
    </Box>
  );
}
