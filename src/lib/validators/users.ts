import { z } from 'zod';

export const INTERNAL_DOMAIN = 'cabelab.local';

export const loginSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, 'El usuario debe tener al menos 3 caracteres')
    .max(30, 'El usuario no puede exceder 30 caracteres')
    .regex(/^[a-z0-9._-]+$/, 'Solo minúsculas, números, puntos, guiones y guiones bajos'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

export const createUserSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, 'El usuario debe tener al menos 3 caracteres')
    .max(30, 'El usuario no puede exceder 30 caracteres')
    .regex(/^[a-z0-9._-]+$/, 'Solo minúsculas, números, puntos, guiones y guiones bajos'),
  fullName: z.string().trim().min(3, 'Nombre completo requerido').max(100),
  role: z.enum(['SOLICITANTE', 'ADMIN_TI']),
  tempPassword: z.string().min(6, 'La contraseña temporal debe tener al menos 6 caracteres'),
});

export const setActiveSchema = z.object({
  userId: z.string().uuid('ID de usuario inválido'),
  active: z.boolean(),
});

export const resetPasswordSchema = z.object({
  userId: z.string().uuid('ID de usuario inválido'),
  newPassword: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type SetActiveInput = z.infer<typeof setActiveSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
