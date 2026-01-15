import { z } from 'zod';

export const createRoleSchema = z.object({
  name: z
    .string()
    .min(3, 'Role name must be at least 3 characters')
    .max(50, 'Role name must be at most 50 characters')
    .regex(/^[a-z0-9_]+$/, 'Role name must be snake_case (lowercase, numbers, underscores)'),

  description: z.string().max(500, 'Description must not exceed 500 characters').optional().or(z.literal('')),
});

export type CreateRoleInput = z.infer<typeof createRoleSchema>;
