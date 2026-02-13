import { describe, it, expect } from 'vitest';

import { toError } from '../../../../apps/cli/management-cli/src/utils/error';

describe('toError', () => {
  it('returns Error instance as-is', () => {
    const err = new Error('test error');
    expect(toError(err, 'fallback')).toBe(err);
  });

  it('converts string to Error', () => {
    const result = toError('string error', 'fallback');
    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe('string error');
  });

  it('uses fallback for null', () => {
    const result = toError(null, 'fallback message');
    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe('fallback message');
  });

  it('uses fallback for undefined', () => {
    const result = toError(undefined, 'fallback message');
    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe('fallback message');
  });

  it('uses fallback for object', () => {
    const result = toError({ foo: 'bar' }, 'fallback message');
    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe('fallback message');
  });

  it('uses fallback for number', () => {
    const result = toError(42, 'fallback message');
    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe('fallback message');
  });
});
