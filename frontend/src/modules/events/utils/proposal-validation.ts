import { PROPOSAL_COVER_MAX_BYTES, PROPOSAL_DESCRIPTION_LIMIT, PROPOSAL_TITLE_LIMIT } from '../constants/proposal.constants';
import type { ProposalErrors, ProposalValues } from '../types/proposal.types';

export function validateProposalCover(file: File): string | null {
  if (!['image/jpeg', 'image/png'].includes(file.type)) return 'Selecciona una imagen JPG o PNG.';
  if (!file.size) return 'La imagen está vacía o dañada. Selecciona otro archivo.';
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

  if (!/^\d{4}-\d{2}-\d{2}$/.test(values.eventDate)) {
    errors.eventDate = 'Selecciona una fecha válida.';
  } else {
    const date = new Date(`${values.eventDate}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const minDate = new Date(today);
    minDate.setDate(today.getDate() + 10);

    const maxDate = new Date(today);
    maxDate.setMonth(today.getMonth() + 6);

    if (Number.isNaN(date.getTime()) || [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-') !== values.eventDate) {
      errors.eventDate = 'Selecciona una fecha válida.';
    } else if (date < minDate) {
      errors.eventDate = 'La fecha debe ser al menos 10 días después de hoy.';
    } else if (date > maxDate) {
      errors.eventDate = 'La fecha no puede superar los 6 meses a futuro.';
    }
  }

  if (!isProposalTime(values.startTime)) errors.startTime = 'Selecciona la hora de inicio.';
  if (!isProposalTime(values.endTime)) errors.endTime = 'Selecciona la hora de finalización.';
  else if (isProposalTime(values.startTime) && values.endTime <= values.startTime) {
    errors.endTime = 'La finalización debe ser posterior al inicio.';
  }

  const capacity = Number(values.capacity);
  if (!/^\d+$/.test(values.capacity) || !Number.isSafeInteger(capacity)) {
    errors.capacity = 'Ingresa un número entero de cupos.';
  } else if (capacity < 20) {
    errors.capacity = 'El cupo mínimo es de 20 personas.';
  } else if (capacity > 60) {
    errors.capacity = 'El cupo máximo es de 60 personas.';
  }

  if (!['presencial', 'virtual'].includes(values.modality)) errors.modality = 'Selecciona una modalidad válida.';

  if (!values.location.trim()) {
    errors.location = values.modality === 'virtual' ? 'Ingresa el enlace de la reunión.' : 'Ingresa la ubicación del taller.';
  } else if (values.modality === 'virtual') {
    try {
      const url = new URL(values.location.trim());
      if (!['https:', 'http:'].includes(url.protocol) || !url.hostname || url.username || url.password) throw new Error('Invalid URL');
    } catch {
      errors.location = 'Ingresa un enlace válido que comience con https:// o http://.';
    }
  }

  if (!cover) errors.cover = 'Agrega una portada para el taller.';
  else {
    const coverError = validateProposalCover(cover);
    if (coverError) errors.cover = coverError;
  }

  return errors;
}
