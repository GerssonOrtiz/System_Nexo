import { z } from 'zod';

export const createBoardSchema = z.object({
  model: z.string().trim().min(2, 'El modelo debe tener al menos 2 caracteres').max(100),
  ownerName: z.string().trim().min(2, 'El propietario o cliente es requerido').max(100),
});

export const advanceStepSchema = z.object({
  boardId: z.string().uuid(),
  note: z.string().trim().optional(),
});

export const addComponentSchema = z.object({
  boardId: z.string().uuid(),
  designator: z.string().trim().min(1, 'El designador es requerido (ej. R12, C45)').max(20),
  partNumber: z.string().trim().min(1, 'El número de parte es requerido').max(100),
  package: z.string().trim().max(50).optional().nullable(),
  status: z.enum(['REQUERIDO', 'EN_STOCK', 'SOLICITADO', 'INSTALADO']).default('REQUERIDO'),
});

export const updateComponentStatusSchema = z.object({
  componentId: z.string().uuid(),
  status: z.enum(['REQUERIDO', 'EN_STOCK', 'SOLICITADO', 'INSTALADO']),
});

export const addLogSchema = z.object({
  boardId: z.string().uuid(),
  kind: z.enum(['NOTA_TECNICA', 'MEDICION', 'CAMBIO_ESTADO', 'ALERTA']),
  body: z.string().trim().min(1, 'El detalle de la bitácora es requerido'),
  measurement: z
    .object({
      point: z.string().trim(),
      value: z.number(),
      unit: z.string().trim(),
    })
    .optional()
    .nullable(),
});

export type CreateBoardInput = z.infer<typeof createBoardSchema>;
export type AdvanceStepInput = z.infer<typeof advanceStepSchema>;
export type AddComponentInput = z.infer<typeof addComponentSchema>;
export type UpdateComponentStatusInput = z.infer<typeof updateComponentStatusSchema>;
export type AddLogInput = z.infer<typeof addLogSchema>;
