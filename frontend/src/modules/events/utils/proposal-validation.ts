import { proposalLocationError } from './proposal-location-validation';
import { PROPOSAL_COVER_MAX_BYTES, PROPOSAL_DESCRIPTION_LIMIT, PROPOSAL_TITLE_LIMIT } from '../constants/proposal.constants';
import type { ProposalErrors, ProposalValues } from '../types/proposal.types';

export function validateProposalCover(file: File): string | null {
  if (!['image/jpeg', 'image/png'].includes(file.type)) return 'Selecciona una imagen JPG o PNG.';
  if (!file.size) return 'La imagen está vacía. Selecciona otra.';
  if (file.size > PROPOSAL_COVER_MAX_BYTES) return 'Selecciona una imagen de hasta 2 MB.';
  return null;
}

export function isProposalTime(value: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

export function validateProposal(values: ProposalValues, cover: File | null, categoryIds: readonly string[]): ProposalErrors {
  const errors: ProposalErrors = {};

  const repeatedCharacter = (text: string) => /^(.)\1{3,}$/iu.test(text.trim().replace(/\s/gu, '').normalize('NFC'));

  if (!values.title.trim()) errors.title = 'Escribe el título del taller.';
  else if (values.title.length > PROPOSAL_TITLE_LIMIT) errors.title = 'Usa hasta 80 caracteres.';

  else if (!/\p{L}/u.test(values.title)) errors.title = 'Incluye palabras en el título.';
  else if (repeatedCharacter(values.title)) errors.title = 'Evita repetir un solo carácter.';

  if (!values.description.trim()) errors.description = 'Describe el contenido del taller.';
  else if (values.description.length > PROPOSAL_DESCRIPTION_LIMIT) errors.description = 'Usa hasta 300 caracteres.';

  else if (!/\p{L}/u.test(values.description)) errors.description = 'Incluye palabras en la descripción.';
  else if (repeatedCharacter(values.description)) errors.description = 'Evita repetir un solo carácter.';

  if (!values.categoryId) errors.categoryId = 'Selecciona una categoría.';
  else if (!categoryIds.includes(values.categoryId)) errors.categoryId = 'Esta categoría ya no está disponible. Elige otra.';

  if (!/^\d{4}-\d{2}-\d{2}$/.test(values.eventDate)) {
    errors.eventDate = values.eventDate ? 'Ingresa una fecha válida.' : 'Selecciona la fecha del taller.';
  } else {
    const date = new Date(`${values.eventDate}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const minDate = new Date(today);
    minDate.setDate(today.getDate() + 10);

    const maxDate = new Date(today);
    maxDate.setMonth(today.getMonth() + 6);

    if (Number.isNaN(date.getTime()) || [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-') !== values.eventDate) {
      errors.eventDate = values.eventDate ? 'Ingresa una fecha válida.' : 'Selecciona la fecha del taller.';
    } else if (date < minDate) {
      errors.eventDate = `Elige una fecha desde el ${minDate.toLocaleDateString('es-BO')}.`;
    } else if (date > maxDate) {
      errors.eventDate = `Elige una fecha hasta el ${maxDate.toLocaleDateString('es-BO')}.`;
    }
  }

  if (!isProposalTime(values.startTime)) errors.startTime = values.startTime ? 'Usa una hora de 24 horas, como 14:30.' : 'Selecciona la hora de inicio.';
  if (!isProposalTime(values.endTime)) errors.endTime = values.endTime ? 'Usa una hora de 24 horas, como 14:30.' : 'Selecciona la hora de finalización.';
  else if (isProposalTime(values.startTime) && values.endTime <= values.startTime) {
    errors.endTime = 'La finalización debe ser posterior al inicio.';
  }

  const capacity = Number(values.capacity);
  if (!values.capacity.trim()) {
    errors.capacity = 'Indica el cupo del taller.';
  } else if (!/^\d+$/.test(values.capacity) || !Number.isSafeInteger(capacity)) {
    errors.capacity = 'Ingresa un número entero de cupos.';
  } else if (capacity < 20) {
    errors.capacity = 'Ingresa al menos 20 cupos.';
  } else if (capacity > 60) {
    errors.capacity = 'Ingresa como máximo 60 cupos.';
  }

  if (!['presencial', 'virtual'].includes(values.modality)) errors.modality = 'Selecciona Presencial o Virtual.';

  const locationError = proposalLocationError(values.location, values.modality);
  if (locationError) errors.location = locationError;

  if (!cover) errors.cover = 'Selecciona una portada.';
  else {
    const coverError = validateProposalCover(cover);
    if (coverError) errors.cover = coverError;
  }

  return errors;
}
