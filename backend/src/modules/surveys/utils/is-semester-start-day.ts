const BOLIVIA_TIME_ZONE = 'America/La_Paz';

const dateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: BOLIVIA_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

// Devuelve la fecha (AAAA-MM-DD) en Bolivia si es el primer día de un semestre, o null en cualquier otro día.
export function getSemesterStartDay(now: Date): string | null {
  if (Number.isNaN(now.getTime())) return null;

  const date = dateFormatter.format(now);
  return date.endsWith('-01-01') || date.endsWith('-07-01') ? date : null;
}
