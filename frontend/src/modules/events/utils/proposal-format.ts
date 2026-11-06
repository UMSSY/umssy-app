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
