import { describe, it, expect } from 'vitest';

import { filterUsers, formatDisplayName } from '../../../../apps/web/management-ui/src/utils/user-filter.utils';

describe('filterUsers', () => {
  const users = [
    { username: 'johndoe', email: 'john@test.com', firstName: 'John', lastName: 'Doe' },
    { username: 'janesmith', email: 'jane@test.com', firstName: 'Jane', lastName: 'Smith' },
    { username: 'bobwilson', email: 'bob@test.com', firstName: 'Bob', lastName: 'Wilson' },
  ];

  it('returns all users when search is empty', () => {
    expect(filterUsers(users, '')).toEqual(users);
  });

  it('filters by username - case insensitive', () => {
    expect(filterUsers(users, 'JOHN')).toHaveLength(1);
    expect(filterUsers(users, 'JOHN')[0].username).toBe('johndoe');
  });

  it('filters by email', () => {
    expect(filterUsers(users, 'jane@')).toHaveLength(1);
    expect(filterUsers(users, 'jane@')[0].username).toBe('janesmith');
  });

  it('filters by firstName', () => {
    expect(filterUsers(users, 'bob')).toHaveLength(1);
    expect(filterUsers(users, 'bob')[0].username).toBe('bobwilson');
  });

  it('filters by lastName', () => {
    expect(filterUsers(users, 'smith')).toHaveLength(1);
    expect(filterUsers(users, 'smith')[0].username).toBe('janesmith');
  });

  it('returns empty for no matches', () => {
    expect(filterUsers(users, 'xyz')).toHaveLength(0);
  });

  it('handles null email gracefully', () => {
    const usersWithNull = [{ username: 'test', email: null, firstName: 'Test', lastName: 'User' }];
    expect(() => filterUsers(usersWithNull, 'test')).not.toThrow();
    expect(filterUsers(usersWithNull, 'test')).toHaveLength(1);
  });

  it('handles undefined email gracefully', () => {
    const usersWithUndefined = [{ username: 'test', firstName: 'Test', lastName: 'User' }];
    expect(() => filterUsers(usersWithUndefined, 'test')).not.toThrow();
    expect(filterUsers(usersWithUndefined, 'test')).toHaveLength(1);
  });

  it('handles null firstName gracefully', () => {
    const usersWithNull = [{ username: 'test', email: 'test@test.com', firstName: null, lastName: 'User' }];
    expect(() => filterUsers(usersWithNull, 'test')).not.toThrow();
  });

  it('handles null lastName gracefully', () => {
    const usersWithNull = [{ username: 'test', email: 'test@test.com', firstName: 'Test', lastName: null }];
    expect(() => filterUsers(usersWithNull, 'test')).not.toThrow();
  });

  it('matches partial strings', () => {
    expect(filterUsers(users, 'doe')).toHaveLength(1);
    expect(filterUsers(users, 'test.com')).toHaveLength(3);
  });
});

describe('formatDisplayName', () => {
  it('combines firstName and lastName', () => {
    expect(formatDisplayName({ firstName: 'John', lastName: 'Doe' })).toBe('John Doe');
  });

  it('returns firstName only when lastName missing', () => {
    expect(formatDisplayName({ firstName: 'John' })).toBe('John');
  });

  it('returns lastName only when firstName missing', () => {
    expect(formatDisplayName({ lastName: 'Doe' })).toBe('Doe');
  });

  it('returns dash when both missing', () => {
    expect(formatDisplayName({})).toBe('-');
  });

  it('handles null values', () => {
    expect(formatDisplayName({ firstName: null, lastName: null })).toBe('-');
  });

  it('trims whitespace', () => {
    expect(formatDisplayName({ firstName: '  John  ', lastName: '  Doe  ' })).toBe('John Doe');
  });

  it('handles empty strings', () => {
    expect(formatDisplayName({ firstName: '', lastName: '' })).toBe('-');
  });
});
