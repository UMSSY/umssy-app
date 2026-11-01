import { proposalLocationError } from './proposal-location-validation.js';
import { z } from 'zod';

const time = (label: string) => z.string({ error: label }).min(1, label).pipe(z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Usa una hora de 24 horas, como 14:30.'));
export const CreateProposalSchema = z.object({
  title: z.string({ error: 'Escribe el título del taller.' }).trim().min(1, 'Escribe el título del taller.').max(80, 'Usa hasta 80 caracteres.'),
  description: z.string({ error: 'Describe el contenido del taller.' }).trim().min(1, 'Describe el contenido del taller.').max(300, 'Usa hasta 300 caracteres.'),
  categoryId: z.string({ error: 'Selecciona una categoría.' }).min(1, 'Selecciona una categoría.').pipe(z.guid({ error: 'Selecciona una categoría válida.' })),
  eventDate: z.string({ error: 'Selecciona la fecha del taller.' }).min(1, 'Selecciona la fecha del taller.').pipe(z.iso.date({ error: 'Ingresa una fecha válida.' })),
  startTime: time('Selecciona la hora de inicio.'),
  endTime: time('Selecciona la hora de finalización.'),
  capacity: z.string({ error: 'Indica el cupo del taller.' }).min(1, 'Indica el cupo del taller.').pipe(z.string().regex(/^\d+$/, 'Ingresa un número entero de cupos.')).transform(Number).pipe(z.number().int('Ingresa un número entero de cupos.').min(20, 'Ingresa al menos 20 cupos.').max(60, 'Ingresa como máximo 60 cupos.')),
  modality: z.enum(['presencial', 'virtual'], { error: 'Selecciona Presencial o Virtual.' }),
  location: z.string({ error: 'Completa la ubicación o el enlace.' }).trim(),
}).strict().superRefine((value, context) => {
  for (const field of ['title', 'description'] as const) {
    if (!value[field] || value[field].length > (field === 'title' ? 80 : 300)) continue;
    if (!/\p{L}/u.test(value[field])) context.addIssue({ code: 'custom', path: [field], message: field === 'title' ? 'Incluye palabras en el título.' : 'Incluye palabras en la descripción.' });
    else if (/^(.)\1{3,}$/iu.test(value[field].replace(/\s/gu, '').normalize('NFC'))) context.addIssue({ code: 'custom', path: [field], message: 'Evita repetir un solo carácter.' });
  }
  if (value.endTime <= value.startTime) context.addIssue({ code: 'custom', path: ['endTime'], message: 'La finalización debe ser posterior al inicio.' });
  const locationError = proposalLocationError(value.location, value.modality);
  if (locationError) context.addIssue({ code: 'custom', path: ['location'], message: locationError });
});
export type { CreateProposalPayload } from '../types/create-proposal-payload.types.js';
