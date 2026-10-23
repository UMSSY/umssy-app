import { PROPOSAL_COVER_MAX_BYTES, PROPOSAL_DESCRIPTION_LIMIT, PROPOSAL_TITLE_LIMIT } from '../constants/proposal.constants';
import type { ProposalErrors, ProposalValues } from '../types/proposal.types';

export function validateProposalCover(file: File): string | null {
  if (!['image/jpeg', 'image/png'].includes(file.type)) return 'Selecciona una imagen JPG o PNG.';
  if (!file.size) return 'La imagen está vacía. Selecciona otro archivo.';
  if (file.size > PROPOSAL_COVER_MAX_BYTES) return 'La imagen debe pesar como máximo 5 MB.';
  return null;
}

export function isProposalTime(value: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

export function validateProposal(values: ProposalValues, cover: File | null, categoryIds: readonly string[]): ProposalErrors {
  const errors: ProposalErrors = {};
  if (!values.title.trim()) errors.title = 'Ingresa el título del taller.';
  else if (values.title.length > PROPOSAL_TITLE_LIMIT) errors.title = 'El título admite hasta 80 caracteres.';
  if (!values.description.trim()) errors.description = 'Describe el contenido del taller.';
  else if (values.description.length > PROPOSAL_DESCRIPTION_LIMIT) errors.description = 'La descripción admite hasta 300 caracteres.';
  if (!categoryIds.includes(values.categoryId)) errors.categoryId = 'Selecciona una categoría disponible.';
  const date = new Date(`${values.eventDate}T12:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(values.eventDate) || Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== values.eventDate) {
    errors.eventDate = 'Selecciona una fecha válida.';
  }
  if (!isProposalTime(values.startTime)) errors.startTime = 'Selecciona la hora de inicio.';
  if (!isProposalTime(values.endTime)) errors.endTime = 'Selecciona la hora de finalización.';
  else if (isProposalTime(values.startTime) && values.endTime <= values.startTime) errors.endTime = 'La finalización debe ser posterior al inicio.';
  if (!/^\d+$/.test(values.capacity) || !Number.isSafeInteger(Number(values.capacity)) || Number(values.capacity) < 1 || Number(values.capacity) > 2147483647) {
    errors.capacity = 'Ingresa un número entero de cupos mayor que cero.';
  }
  if (!['presencial', 'virtual'].includes(values.modality)) errors.modality = 'Selecciona una modalidad válida.';
  if (!values.location.trim()) errors.location = values.modality === 'virtual' ? 'Ingresa el enlace de la reunión.' : 'Ingresa la ubicación del taller.';
  else if (values.modality === 'virtual') {
    try {
      const url = new URL(values.location.trim());
      if (!['https:', 'http:'].includes(url.protocol) || !url.hostname || url.username || url.password) throw new Error('Invalid URL');
    } catch { errors.location = 'Ingresa un enlace válido que comience con https:// o http://.'; }
  }
  if (!cover) errors.cover = 'Agrega una portada para el taller.';
  else {
    const coverError = validateProposalCover(cover);
    if (coverError) errors.cover = coverError;
  }
  return errors;
}
