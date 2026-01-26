import { Box, Text } from 'ink';
import { ComponentProps } from 'react';

interface DetailRowProps {
  label: string;
  labelWidth?: number;
  value: string;
  color?: ComponentProps<typeof Text>['color'];
}

export function DetailRow({ label, labelWidth = 12, value, color }: DetailRowProps) {
  return (
    <Box>
      <Text bold>{`${label.padEnd(labelWidth)}:`}</Text>
      <Text color={color}> {value}</Text>
    </Box>
  );
}
