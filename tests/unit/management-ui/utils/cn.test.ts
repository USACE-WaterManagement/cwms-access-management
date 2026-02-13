import { describe, it, expect } from 'vitest';

import { cn } from '../../../../apps/web/management-ui/src/lib/utils';

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('px-2', 'py-4')).toBe('px-2 py-4');
  });

  it('resolves Tailwind conflicts - last wins', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
  });

  it('handles conditional classes with object', () => {
    expect(cn('base', { active: true, disabled: false })).toBe('base active');
  });

  it('handles arrays of classes', () => {
    expect(cn(['a', 'b'], 'c')).toBe('a b c');
  });

  it('handles undefined gracefully', () => {
    expect(cn('a', undefined, 'b')).toBe('a b');
  });

  it('handles null gracefully', () => {
    expect(cn('a', null, 'b')).toBe('a b');
  });

  it('handles empty string', () => {
    expect(cn('a', '', 'b')).toBe('a b');
  });

  it('handles false conditions', () => {
    const isActive = false;
    expect(cn('base', isActive && 'active')).toBe('base');
  });

  it('handles true conditions', () => {
    const isActive = true;
    expect(cn('base', isActive && 'active')).toBe('base active');
  });

  it('merges padding conflicts correctly', () => {
    expect(cn('p-4', 'px-2')).toBe('p-4 px-2');
  });

  it('merges text color conflicts correctly', () => {
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
  });
});
