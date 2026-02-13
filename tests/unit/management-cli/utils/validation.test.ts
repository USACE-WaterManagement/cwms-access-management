import { describe, it, expect } from 'vitest';

import {
  createRoleSchema,
  createUserSchema,
} from '../../../../apps/cli/management-cli/src/utils/validation';

describe('createRoleSchema', () => {
  describe('name field', () => {
    it('accepts valid snake_case names', () => {
      const result = createRoleSchema.safeParse({ name: 'admin_role' });
      expect(result.success).toBe(true);
    });

    it('rejects names shorter than 3 characters', () => {
      const result = createRoleSchema.safeParse({ name: 'ab' });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe('Role name must be at least 3 characters');
    });

    it('rejects names longer than 50 characters', () => {
      const result = createRoleSchema.safeParse({ name: 'a'.repeat(51) });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe('Role name must be at most 50 characters');
    });

    it('rejects uppercase letters', () => {
      const result = createRoleSchema.safeParse({ name: 'Admin_Role' });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toContain('snake_case');
    });

    it('rejects invalid characters', () => {
      expect(createRoleSchema.safeParse({ name: 'admin-role' }).success).toBe(false);
      expect(createRoleSchema.safeParse({ name: 'admin role' }).success).toBe(false);
    });
  });

  describe('description field', () => {
    it('accepts valid descriptions', () => {
      const result = createRoleSchema.safeParse({
        name: 'admin',
        description: 'Administrator role with full access',
      });
      expect(result.success).toBe(true);
    });

    it('rejects descriptions longer than 500 characters', () => {
      const result = createRoleSchema.safeParse({
        name: 'admin',
        description: 'a'.repeat(501),
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe('Description must not exceed 500 characters');
    });
  });
});

describe('createUserSchema', () => {
  const validUser = {
    username: 'john_doe',
    email: 'john@example.com',
    password: 'Password123',
    name: 'John Doe',
  };

  describe('username field', () => {
    it('accepts valid usernames', () => {
      const result = createUserSchema.safeParse(validUser);
      expect(result.success).toBe(true);
    });

    it('rejects usernames shorter than 3 characters', () => {
      const result = createUserSchema.safeParse({
        ...validUser,
        username: 'ab',
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe('Username must be at least 3 characters');
    });

    it('rejects usernames longer than 30 characters', () => {
      const result = createUserSchema.safeParse({
        ...validUser,
        username: 'a'.repeat(31),
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe('Username must be at most 30 characters');
    });

    it('rejects invalid characters', () => {
      expect(createUserSchema.safeParse({ ...validUser, username: 'john@doe' }).success).toBe(false);
      expect(createUserSchema.safeParse({ ...validUser, username: 'john doe' }).success).toBe(false);
    });
  });

  describe('email field', () => {
    it('accepts valid email addresses', () => {
      const result = createUserSchema.safeParse(validUser);
      expect(result.success).toBe(true);
    });

    it('rejects invalid email format', () => {
      const result = createUserSchema.safeParse({
        ...validUser,
        email: 'invalid-email',
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe('Invalid email format');
    });
  });

  describe('password field', () => {
    it('accepts valid passwords', () => {
      const result = createUserSchema.safeParse(validUser);
      expect(result.success).toBe(true);
    });

    it('rejects passwords shorter than 8 characters', () => {
      const result = createUserSchema.safeParse({
        ...validUser,
        password: 'Pass1',
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe('Password must be at least 8 characters');
    });

    it('rejects passwords without letters', () => {
      const result = createUserSchema.safeParse({
        ...validUser,
        password: '12345678',
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.some((i) => i.message.includes('letter'))).toBe(true);
    });

    it('rejects passwords without numbers', () => {
      const result = createUserSchema.safeParse({
        ...validUser,
        password: 'Password',
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.some((i) => i.message.includes('number'))).toBe(true);
    });
  });

  describe('name field', () => {
    it('rejects names shorter than 2 characters', () => {
      const result = createUserSchema.safeParse({
        ...validUser,
        name: 'J',
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe('Name must be at least 2 characters');
    });
  });

  describe('enabled field', () => {
    it('defaults to true when omitted', () => {
      const result = createUserSchema.safeParse(validUser);
      expect(result.success).toBe(true);
      expect(result.data?.enabled).toBe(true);
    });
  });
});
