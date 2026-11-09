'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/auth';
import {
  addCommentSchema,
  assignTicketSchema,
  createTicketSchema,
  updateTicketStatusSchema,
} from '@/lib/validators/tickets';
import type { ActionResult } from '@/lib/types';

export async function createTicket(
  input: unknown
): Promise<ActionResult<{ id: string }>> {
  const me = await getCurrentProfile();
  if (!me) return { success: false, error: 'No autenticado' };

  const parsed = createTicketSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? 'Datos de ticket inválidos',
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('tickets')
    .insert({
      requester_id: me.id,
      title: parsed.data.title,
      description: parsed.data.description,
      priority: parsed.data.priority,
      status: 'ABIERTO',
    })
    .select('id')
    .single();

  if (error || !data) {
    return { success: false, error: 'Error al registrar el ticket' };
  }

  revalidatePath('/tickets');
  return { success: true, data: { id: data.id } };
}

export async function updateTicketStatus(
  input: unknown
): Promise<ActionResult<null>> {
  const me = await getCurrentProfile();
  if (me?.role !== 'ADMIN_TI') {
    return { success: false, error: 'Solo administradores de TI pueden modificar el estado de tickets' };
  }

  const parsed = updateTicketStatusSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: 'Datos inválidos' };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('tickets')
    .update({
      status: parsed.data.status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', parsed.data.ticketId);

  if (error) {
    return { success: false, error: 'No se pudo actualizar el estado' };
  }

  revalidatePath('/tickets');
  revalidatePath(`/tickets/${parsed.data.ticketId}`);
  return { success: true, data: null };
}

export async function assignTicket(
  input: unknown
): Promise<ActionResult<null>> {
  const me = await getCurrentProfile();
  if (me?.role !== 'ADMIN_TI') {
    return { success: false, error: 'Solo administradores de TI pueden asignar tickets' };
  }

  const parsed = assignTicketSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: 'Datos inválidos' };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('tickets')
    .update({
      assignee_id: parsed.data.assigneeId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', parsed.data.ticketId);

  if (error) {
    return { success: false, error: 'No se pudo asignar el ticket' };
  }

  revalidatePath('/tickets');
  revalidatePath(`/tickets/${parsed.data.ticketId}`);
  return { success: true, data: null };
}

export async function addComment(
  input: unknown
): Promise<ActionResult<null>> {
  const me = await getCurrentProfile();
  if (!me) return { success: false, error: 'No autenticado' };

  const parsed = addCommentSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? 'Comentario inválido',
    };
  }

  // Solicitantes no pueden crear comentarios internos
  if (parsed.data.isInternal && me.role !== 'ADMIN_TI') {
    return { success: false, error: 'Solo administradores pueden crear notas internas' };
  }

  const supabase = await createClient();
  const { error } = await supabase.from('ticket_comments').insert({
    ticket_id: parsed.data.ticketId,
    author_id: me.id,
    body: parsed.data.body,
    is_internal: parsed.data.isInternal,
  });

  if (error) {
    return { success: false, error: 'Error al enviar el comentario' };
  }

  revalidatePath(`/tickets/${parsed.data.ticketId}`);
  return { success: true, data: null };
}
