import { isProposalTime } from './proposal-validation';

export function formatProposalTime(value: string): string {
  if (!isProposalTime(value)) return value || 'hh:mm';
  const [hours, minutes] = value.split(':').map(Number);
  return `${String(hours % 12 || 12).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${hours < 12 ? 'AM' : 'PM'}`;
}

export function formatProposalDuration(start: string, finish: string): string | null {
  if (!isProposalTime(start) || !isProposalTime(finish)) return null;
  const toMinutes = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3));
  const duration = toMinutes(finish) - toMinutes(start);
  if (duration <= 0) return null;
  const hours = Math.floor(duration / 60);
  const minutes = duration % 60;
  return [hours ? `${hours} ${hours === 1 ? 'hora' : 'horas'}` : '', minutes ? `${minutes} min` : ''].filter(Boolean).join(' ');
}

export function formatProposalDate(value: string): string {
  return value.split('-').reverse().join('/');
}

// Accept browser autofill in 12-hour notation, but keep the API value in HH:mm.
export function normalizeProposalTime(value: string): string {
  const match = value.trim().match(/^(\d{1,2}):([0-5]\d)(?:\s*([ap])\.?\s*m\.?)?$/i);
  if (!match) return value;
  let hour = Number(match[1]);
  const period = match[3]?.toLowerCase();
  if (period) {
    if (hour < 1 || hour > 12) return value;
    hour = hour % 12 + (period === 'p' ? 12 : 0);
  } else if (hour > 23) return value;
  return String(hour).padStart(2, '0') + ':' + match[2];
}

export function proposalTimeSuggestions(startTime?: string, endTime?: string): string[] {
  if (startTime === undefined && !endTime) return ['08:00', '14:00', '18:00'];
  const start = normalizeProposalTime(startTime ?? endTime ?? '');
  if (!isProposalTime(start)) return [];
  const minutes = Number(start.slice(0, 2)) * 60 + Number(start.slice(3));
  return [60, 120, 180].map(offset => minutes + (startTime === undefined ? -offset : offset)).filter(total => total >= 0 && total < 1440).sort((a, b) => a - b)
    .map(total => String(Math.floor(total / 60)).padStart(2, '0') + ':' + String(total % 60).padStart(2, '0'));
}
