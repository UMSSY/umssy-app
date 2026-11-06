const pad = (value: number): string => String(value).padStart(2, '0');


export function formatTime12h(date: Date): string {
  const hours = date.getHours();
  const period = hours >= 12 ? 'PM' : 'AM';
  return `${pad(hours % 12 || 12)}:${pad(date.getMinutes())} ${period}`;
}

export function formatConversationDate(isoDateString?: string | null): string {
  if (!isoDateString) {
    return '';
  }

  const date = new Date(isoDateString);
  if (isNaN(date.getTime())) {
    return '';
  }

  const now = new Date();

  const isSameDay =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  if (isSameDay) {
        return formatTime12h(date);
    }
  

  if (isYesterday) {
    return 'Ayer';
  
  }
    return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${pad(date.getFullYear() % 100)}`;

  
}

export function getInitials(fullName: string): string {
  if (!fullName) return 'U';
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function formatMessageDateSeparator(isoString?: string | null): string {
  if (!isoString) return '';

  const date = new Date(isoString);
  if (isNaN(date.getTime())) return '';

  const now = new Date();
  const isSameDay =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isSameDay) {
    return 'HOY';
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  if (isYesterday) {
    return 'AYER';
  }

  return new Intl.DateTimeFormat('es-BO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
    .format(date)
    .toUpperCase();
}

export const BOLIVIA_TIME_ZONE = 'America/La_Paz';

/**
 * Formatea la fecha de creación de la sala de evento como dd/mm/aa
 * en hora de Bolivia (America/La_Paz).
 */
export function formatEventRoomCreatedAt(
  isoDateString?: string | null,
): string {
  if (!isoDateString) {
    return '';
  }

  const date = new Date(isoDateString);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat('es-BO', {
    timeZone: BOLIVIA_TIME_ZONE,
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  }).format(date);
}

/**
 * Formatea la hora de un mensaje en hora de Bolivia (America/La_Paz),
 * reutilizando el criterio de zona horaria del chat (es-BO).
 */
export function formatEventRoomTime(isoDateString?: string | null): string {
  if (!isoDateString) {
    return '';
  }

  const date = new Date(isoDateString);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat('es-BO', {
    timeZone: BOLIVIA_TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h12',
  }).format(date);
}