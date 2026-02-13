import { describe, it, expect, vi } from 'vitest';

import { intersperse } from '../../../../apps/cli/management-cli/src/utils/array.utils';

describe('intersperse', () => {
  it('inserts separator between elements', () => {
    const result = intersperse(() => '|', ['a', 'b', 'c']);
    expect(result).toEqual(['a', '|', 'b', '|', 'c']);
  });

  it('returns empty array for empty input', () => {
    expect(intersperse(() => '|', [])).toEqual([]);
  });

  it('returns single element without separator', () => {
    expect(intersperse(() => '|', ['a'])).toEqual(['a']);
  });

  it('calls separator function with correct index', () => {
    const sep = vi.fn((i: number) => i.toString());
    intersperse(sep, ['a', 'b', 'c']);
    expect(sep).toHaveBeenCalledWith(0);
    expect(sep).toHaveBeenCalledWith(1);
    expect(sep).toHaveBeenCalledTimes(2);
  });

  it('works with different types', () => {
    const result = intersperse(() => 0, [1, 2, 3]);
    expect(result).toEqual([1, 0, 2, 0, 3]);
  });

  it('separator can return different values based on index', () => {
    const result = intersperse((i) => `-${i}-`, ['a', 'b', 'c']);
    expect(result).toEqual(['a', '-0-', 'b', '-1-', 'c']);
  });
});
