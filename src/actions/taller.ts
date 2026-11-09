'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/auth';
import {
  addComponentSchema,
  addLogSchema,
  advanceStepSchema,
  createBoardSchema,
  updateComponentStatusSchema,
} from '@/lib/validators/taller';
import type { ActionResult } from '@/lib/types';
import type { BoardStatus } from '@/lib/supabase/types';

export async function createBoard(
  input: unknown
): Promise<ActionResult<{ id: string }>> {
  const me = await getCurrentProfile();
  if (me?.role !== 'ADMIN_TI') {
    return { success: false, error: 'No autorizado. Solo personal del laboratorio puede registrar tarjetas.' };
  }

  const parsed = createBoardSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? 'Datos inválidos',
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc('create_board', {
    p_model: parsed.data.model,
    p_owner: parsed.data.ownerName,
  });

  if (error || !data) {
    return { success: false, error: error?.message || 'Error al generar la tarjeta correlativa' };
  }

  revalidatePath('/taller');
  return { success: true, data: { id: data } };
}

export async function advanceBoardStep(
  input: unknown
): Promise<ActionResult<{ status: BoardStatus }>> {
  const me = await getCurrentProfile();
  if (me?.role !== 'ADMIN_TI') {
    return { success: false, error: 'No autorizado' };
  }

  const parsed = advanceStepSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: 'Datos inválidos' };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc('advance_board_step', {
    p_board_id: parsed.data.boardId,
    p_note: parsed.data.note || 'Avance de pipeline registrado',
  });

  if (error || !data) {
    return { success: false, error: error?.message || 'Error al avanzar pipeline de la tarjeta' };
  }

  revalidatePath('/taller');
  revalidatePath(`/taller/${parsed.data.boardId}`);
  return { success: true, data: { status: data as BoardStatus } };
}

export async function addComponent(
  input: unknown
): Promise<ActionResult<{ id: string }>> {
  const me = await getCurrentProfile();
  if (me?.role !== 'ADMIN_TI') {
    return { success: false, error: 'No autorizado' };
  }

  const parsed = addComponentSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? 'Datos inválidos',
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('board_components')
    .insert({
      board_id: parsed.data.boardId,
      designator: parsed.data.designator.toUpperCase(),
      part_number: parsed.data.partNumber,
      package: parsed.data.package || null,
      status: parsed.data.status,
    })
    .select('id')
    .single();

  if (error || !data) {
    return {
      success: false,
      error: error?.message.includes('unique')
        ? 'El designador ya existe en esta tarjeta'
        : 'Error al agregar el componente al BOM',
    };
  }

  revalidatePath(`/taller/${parsed.data.boardId}`);
  return { success: true, data: { id: data.id } };
}

export async function updateComponentStatus(
  input: unknown
): Promise<ActionResult<null>> {
  const me = await getCurrentProfile();
  if (me?.role !== 'ADMIN_TI') {
    return { success: false, error: 'No autorizado' };
  }

  const parsed = updateComponentStatusSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: 'Datos inválidos' };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('board_components')
    .update({ status: parsed.data.status })
    .eq('id', parsed.data.componentId);

  if (error) {
    return { success: false, error: 'Error al actualizar estado del componente' };
  }

  revalidatePath('/taller');
  return { success: true, data: null };
}

export async function addBoardLog(
  input: unknown
): Promise<ActionResult<null>> {
  const me = await getCurrentProfile();
  if (me?.role !== 'ADMIN_TI') {
    return { success: false, error: 'No autorizado' };
  }

  const parsed = addLogSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: 'Datos inválidos de bitácora' };
  }

  const supabase = await createClient();
  const { error } = await supabase.from('board_logs').insert({
    board_id: parsed.data.boardId,
    author_id: me.id,
    kind: parsed.data.kind,
    body: parsed.data.body,
    measurement: parsed.data.measurement ? parsed.data.measurement : null,
  });

  if (error) {
    return { success: false, error: 'Error al guardar la entrada en la bitácora' };
  }

  revalidatePath(`/taller/${parsed.data.boardId}`);
  return { success: true, data: null };
}
