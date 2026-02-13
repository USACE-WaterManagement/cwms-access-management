import { describe, it, expect } from 'vitest';

import { formatFullName } from '../../../../apps/cli/management-cli/src/utils/format.utils';

describe('formatFullName', () => {
  it('combines firstName and lastName', () => {
    expect(formatFullName({ firstName: 'John', lastName: 'Doe' })).toBe('John Doe');
  });

  it('returns firstName only when lastName missing', () => {
    expect(formatFullName({ firstName: 'John' })).toBe('John');
  });

  it('returns lastName only when firstName missing', () => {
    expect(formatFullName({ lastName: 'Doe' })).toBe('Doe');
  });

  it('returns dash when both missing', () => {
    expect(formatFullName({})).toBe('-');
  });

  it('trims whitespace from firstName', () => {
    expect(formatFullName({ firstName: '  John  ' })).toBe('John');
  });

  it('trims whitespace from lastName', () => {
    expect(formatFullName({ lastName: '  Doe  ' })).toBe('Doe');
  });

  it('trims whitespace from both names', () => {
    expect(formatFullName({ firstName: '  John  ', lastName: '  Doe  ' })).toBe('John Doe');
  });

  it('handles empty strings as missing', () => {
    expect(formatFullName({ firstName: '', lastName: '' })).toBe('-');
  });

  it('handles whitespace-only strings as missing', () => {
    expect(formatFullName({ firstName: '   ', lastName: '   ' })).toBe('-');
  });
});
