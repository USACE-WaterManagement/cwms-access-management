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

    it('accepts names with numbers', () => {
      const result = createRoleSchema.safeParse({ name: 'role_123' });
      expect(result.success).toBe(true);
    });

    it('accepts single word names', () => {
      const result = createRoleSchema.safeParse({ name: 'admin' });
      expect(result.success).toBe(true);
    });

    it('rejects names shorter than 3 characters', () => {
      const result = createRoleSchema.safeParse({ name: 'ab' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Role name must be at least 3 characters');
      }
    });

    it('rejects names longer than 50 characters', () => {
      const result = createRoleSchema.safeParse({ name: 'a'.repeat(51) });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Role name must be at most 50 characters');
      }
    });

    it('rejects uppercase letters', () => {
      const result = createRoleSchema.safeParse({ name: 'Admin_Role' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('snake_case');
      }
    });

    it('rejects hyphens', () => {
      const result = createRoleSchema.safeParse({ name: 'admin-role' });
      expect(result.success).toBe(false);
    });

    it('rejects spaces', () => {
      const result = createRoleSchema.safeParse({ name: 'admin role' });
      expect(result.success).toBe(false);
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

    it('accepts empty description', () => {
      const result = createRoleSchema.safeParse({
        name: 'admin',
        description: '',
      });
      expect(result.success).toBe(true);
    });

    it('accepts omitted description', () => {
      const result = createRoleSchema.safeParse({ name: 'admin' });
      expect(result.success).toBe(true);
    });

    it('rejects descriptions longer than 500 characters', () => {
      const result = createRoleSchema.safeParse({
        name: 'admin',
        description: 'a'.repeat(501),
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Description must not exceed 500 characters');
      }
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

    it('accepts usernames with hyphens', () => {
      const result = createUserSchema.safeParse({
        ...validUser,
        username: 'john-doe',
      });
      expect(result.success).toBe(true);
    });

    it('accepts usernames with numbers', () => {
      const result = createUserSchema.safeParse({
        ...validUser,
        username: 'john123',
      });
      expect(result.success).toBe(true);
    });

    it('rejects usernames shorter than 3 characters', () => {
      const result = createUserSchema.safeParse({
        ...validUser,
        username: 'ab',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Username must be at least 3 characters');
      }
    });

    it('rejects usernames longer than 30 characters', () => {
      const result = createUserSchema.safeParse({
        ...validUser,
        username: 'a'.repeat(31),
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Username must be at most 30 characters');
      }
    });

    it('rejects usernames with special characters', () => {
      const result = createUserSchema.safeParse({
        ...validUser,
        username: 'john@doe',
      });
      expect(result.success).toBe(false);
    });

    it('rejects usernames with spaces', () => {
      const result = createUserSchema.safeParse({
        ...validUser,
        username: 'john doe',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('email field', () => {
    it('accepts valid email addresses', () => {
      const result = createUserSchema.safeParse(validUser);
      expect(result.success).toBe(true);
    });

    it('accepts email with subdomain', () => {
      const result = createUserSchema.safeParse({
        ...validUser,
        email: 'john@mail.example.com',
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid email format', () => {
      const result = createUserSchema.safeParse({
        ...validUser,
        email: 'invalid-email',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Invalid email format');
      }
    });

    it('rejects email without domain', () => {
      const result = createUserSchema.safeParse({
        ...validUser,
        email: 'john@',
      });
      expect(result.success).toBe(false);
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
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Password must be at least 8 characters');
      }
    });

    it('rejects passwords without letters', () => {
      const result = createUserSchema.safeParse({
        ...validUser,
        password: '12345678',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((i) => i.message.includes('letter'))).toBe(true);
      }
    });

    it('rejects passwords without numbers', () => {
      const result = createUserSchema.safeParse({
        ...validUser,
        password: 'Password',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((i) => i.message.includes('number'))).toBe(true);
      }
    });
  });

  describe('name field', () => {
    it('accepts valid names', () => {
      const result = createUserSchema.safeParse(validUser);
      expect(result.success).toBe(true);
    });

    it('rejects names shorter than 2 characters', () => {
      const result = createUserSchema.safeParse({
        ...validUser,
        name: 'J',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Name must be at least 2 characters');
      }
    });
  });

  describe('enabled field', () => {
    it('defaults to true when omitted', () => {
      const result = createUserSchema.safeParse(validUser);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.enabled).toBe(true);
      }
    });

    it('accepts explicit true value', () => {
      const result = createUserSchema.safeParse({
        ...validUser,
        enabled: true,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.enabled).toBe(true);
      }
    });

    it('accepts explicit false value', () => {
      const result = createUserSchema.safeParse({
        ...validUser,
        enabled: false,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.enabled).toBe(false);
      }
    });
  });
});
