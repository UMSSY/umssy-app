import { z } from 'zod';

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Usa el formato HH:mm.');
export const CreateProposalSchema = z.object({
  title: z.string().trim().min(1).max(80),
  description: z.string().trim().min(1).max(300),
  categoryId: z.guid(),
  eventDate: z.iso.date(),
  startTime: time,
  endTime: time,
  capacity: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().min(1).max(2147483647)),
  modality: z.enum(['presencial', 'virtual']),
  location: z.string().trim().min(1).max(2000),
}).strict().superRefine((value, context) => {
  if (value.endTime <= value.startTime) context.addIssue({ code: 'custom', path: ['endTime'], message: 'La finalización debe ser posterior al inicio.' });
  if (value.modality === 'virtual') {
    try {
      const url = new URL(value.location);
      if (!['http:', 'https:'].includes(url.protocol) || !url.hostname || url.username || url.password) throw new Error();
    } catch { context.addIssue({ code: 'custom', path: ['location'], message: 'Ingresa un enlace http:// o https:// válido.' }); }
  }
});
export type { CreateProposalPayload } from '../types/create-proposal-payload.types.js';
