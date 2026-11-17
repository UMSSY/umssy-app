export function formatRegistrationDate(date: string | null | undefined) {
  const datePart = date?.split('T')[0];
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(datePart ?? '');
  const value = dateMatch
    ? new Date(Date.UTC(Number(dateMatch[1]), Number(dateMatch[2]) - 1, Number(dateMatch[3])))
    : date
      ? new Date(date)
      : null;
  if (!value || !Number.isFinite(value.getTime())) return 'Fecha no disponible';
  return new Intl.DateTimeFormat('es-BO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(value);
}

export function getRegistrationEventTimestamp(
  date: string | null | undefined,
  time: string | null | undefined,
): number {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date?.split('T')[0] ?? '');
  const clockMatch = /^(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?$/.exec(
    time ?? '',
  );
  const timeValue = clockMatch ? null : time ? new Date(time) : null;
  if (!dateMatch) return Number.NaN;

  const year = Number(dateMatch[1]);
  const month = Number(dateMatch[2]);
  const day = Number(dateMatch[3]);
  let hour: number;
  let minute: number;
  let second: number;
  let millisecond: number;
  if (clockMatch) {
    hour = Number(clockMatch[1]);
    minute = Number(clockMatch[2]);
    second = Number(clockMatch[3] ?? 0);
    millisecond = Number((clockMatch[4] ?? '').padEnd(3, '0') || 0);
  } else {
    if (
      !timeValue ||
      !Number.isFinite(timeValue.getTime()) ||
      !time?.includes('T')
    ) {
      return Number.NaN;
    }
    hour = timeValue.getUTCHours();
    minute = timeValue.getUTCMinutes();
    second = timeValue.getUTCSeconds();
    millisecond = timeValue.getUTCMilliseconds();
  }
  const calendarDate = new Date(Date.UTC(year, month - 1, day));
  if (
    calendarDate.getUTCFullYear() !== year ||
    calendarDate.getUTCMonth() !== month - 1 ||
    calendarDate.getUTCDate() !== day ||
    hour > 23 ||
    minute > 59 ||
    second > 59
  ) {
    return Number.NaN;
  }

  return (
    Date.UTC(year, month - 1, day, hour, minute, second, millisecond) +
    4 * 60 * 60 * 1000
  );
}

export function formatRegistrationTime(time: string | null | undefined) {
  if (!time) return 'Horario no disponible';
  const clock = /^(\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?$/.exec(time);
  if (clock) {
    if (
      Number(clock[1]) > 23 ||
      Number(clock[2]) > 59 ||
      Number(clock[3] ?? 0) > 59
    )
      return 'Horario no disponible';
    return `${clock[1]}:${clock[2]}`;
  }
  const value = new Date(time);
  if (!Number.isFinite(value.getTime())) return 'Horario no disponible';
  return new Intl.DateTimeFormat('es-BO', {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone: 'UTC',
  }).format(value);
}

export function formatRegistrationDisplayTime(time: string | null | undefined) {
  const clock = formatRegistrationTime(time);
  const match = /^(\d{2}):(\d{2})$/.exec(clock);
  if (!match) return clock;

  const hour = Number(match[1]);
  const suffix = hour < 12 ? 'AM' : 'PM';
  return `${String(hour % 12 || 12).padStart(2, '0')}:${match[2]} ${suffix}`;
}

export function formatRegistrationTimeRange(startTime: string, endTime: string) {
  const start = formatRegistrationDisplayTime(startTime);
  const end = formatRegistrationDisplayTime(endTime);
  if (start === 'Horario no disponible' || end === 'Horario no disponible') {
    return 'Horario no disponible';
  }
  return `${start} - ${end}`;
}

export function isConfirmedRegistrationStatus(status: string): boolean {
  return (
    status === 'CONFIRMED' ||
    status === 'APPROVED' ||
    status === 'Confirmada'
  );
}

export function getEffectiveRegistrationStatus(
  status: string,
  isPast: boolean,
  isInProgress = false,
) {
  if (isPast && isConfirmedRegistrationStatus(status)) {
    return { label: "Finalizado", isPast: true, code: "FINALIZED" };
  }
  if (isInProgress && isConfirmedRegistrationStatus(status)) {
    return { label: "En curso", isPast: false, code: "IN_PROGRESS" };
  }

  const statusLabels: Record<string, string> = {
    CONFIRMED: "Confirmada",
    APPROVED: "Confirmada",
    PENDING: "Pendiente",
    CANCELLED: "Cancelada",
    FINALIZED: "Finalizado",
  };

  return {
    label: statusLabels[status] ?? status,
    isPast,
    code: status,
  };
}

export function getFinishedRegistrationPresentation() {
  return { label: "Finalizado", code: "FINALIZED" };
}
