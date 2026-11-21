import { getProposalDateError, isProposalTime } from './proposal-validation';
import type { ProposalSession } from '../types/proposal-session.types';
import type { ProposalSessionErrors } from '../types/proposal-session-errors.types';

const OVERLAP_MESSAGE = 'Se superpone con otra sesión.';

// La primera sesión es la fecha y el horario principales del formulario.
export function validateProposalSessions(main: ProposalSession, sessions: ProposalSession[]): ProposalSessionErrors {
  const errors: ProposalSessionErrors = sessions.map((session) => {
    const error: ProposalSessionErrors[number] = {};
    const dateError = getProposalDateError(session.eventDate);
    if (dateError) error.eventDate = dateError;
    if (!isProposalTime(session.startTime)) error.startTime = session.startTime ? 'Usa una hora de 24 horas, como 14:30.' : 'Selecciona la hora de inicio.';
    if (!isProposalTime(session.endTime)) error.endTime = session.endTime ? 'Usa una hora de 24 horas, como 14:30.' : 'Selecciona la hora de finalización.';
    else if (isProposalTime(session.startTime) && session.endTime <= session.startTime) error.endTime = 'La finalización debe ser posterior al inicio.';
    return error;
  });
  const all = [main, ...sessions];
  sessions.forEach((session, index) => {
    if (Object.keys(errors[index]).length) return;
    const overlaps = all.some((other, otherIndex) => otherIndex !== index + 1
      && other.eventDate === session.eventDate
      && other.startTime < session.endTime
      && session.startTime < other.endTime);
    if (overlaps) errors[index].startTime = OVERLAP_MESSAGE;
  });
  return errors;
}

export function hasProposalSessionErrors(errors: ProposalSessionErrors): boolean {
  return errors.some((error) => Object.keys(error).length > 0);
}
