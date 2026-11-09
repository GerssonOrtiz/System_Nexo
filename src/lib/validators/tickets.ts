import { z } from 'zod';

export const createTicketSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, 'El título debe tener al menos 3 caracteres')
    .max(150, 'El título no puede exceder 150 caracteres'),
  description: z
    .string()
    .trim()
    .min(5, 'La descripción debe tener al menos 5 caracteres'),
  priority: z.enum(['BAJA', 'MEDIA', 'ALTA', 'CRITICA']).default('MEDIA'),
});

export const updateTicketStatusSchema = z.object({
  ticketId: z.string().uuid(),
  status: z.enum(['ABIERTO', 'EN_PROGRESO', 'EN_ESPERA', 'RESUELTO', 'CERRADO']),
});

export const assignTicketSchema = z.object({
  ticketId: z.string().uuid(),
  assigneeId: z.string().uuid().nullable(),
});

export const addCommentSchema = z.object({
  ticketId: z.string().uuid(),
  body: z
    .string()
    .trim()
    .min(1, 'El comentario no puede estar vacío')
    .max(5000, 'El comentario no puede exceder 5000 caracteres'),
  isInternal: z.boolean().default(false),
});

export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type UpdateTicketStatusInput = z.infer<typeof updateTicketStatusSchema>;
export type AssignTicketInput = z.infer<typeof assignTicketSchema>;
export type AddCommentInput = z.infer<typeof addCommentSchema>;
