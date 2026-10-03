// Bolivia no usa horario de verano: siempre UTC-4.
export const BOLIVIA_UTC_OFFSET_MINUTES = -240;

const MINUTE_MS = 60_000;
const DAY_MS = 24 * 60 * MINUTE_MS;
const WEEK_MS = 7 * DAY_MS;
const BOLIVIA_OFFSET_MS = BOLIVIA_UTC_OFFSET_MINUTES * MINUTE_MS;

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_PATTERN = /^(\d{2}):(\d{2})$/;

export type DateInput = Date | string;

export interface BoliviaDateTime {
  year: number;
  month: number;
  day: number;
  hours: number;
  minutes: number;
  // ISO 8601: 1 = lunes, 7 = domingo.
  weekday: number;
  date: string;
  time: string;
}

export interface WeekRange {
  startAt: string;
  endAt: string;
}

const pad = (value: number): string => String(value).padStart(2, "0");

const toTimestamp = (value: DateInput): number => {
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) {
    throw new RangeError(`Fecha inválida: ${String(value)}`);
  }
  return timestamp;
};

// Desplaza el instante para que los getters UTC devuelvan la hora de Bolivia.
const toBoliviaShifted = (value: DateInput): Date =>
  new Date(toTimestamp(value) + BOLIVIA_OFFSET_MS);

export const toBoliviaTime = (value: DateInput): BoliviaDateTime => {
  const shifted = toBoliviaShifted(value);
  const year = shifted.getUTCFullYear();
  const month = shifted.getUTCMonth() + 1;
  const day = shifted.getUTCDate();
  const hours = shifted.getUTCHours();
  const minutes = shifted.getUTCMinutes();

  return {
    year,
    month,
    day,
    hours,
    minutes,
    weekday: shifted.getUTCDay() === 0 ? 7 : shifted.getUTCDay(),
    date: `${year}-${pad(month)}-${pad(day)}`,
    time: `${pad(hours)}:${pad(minutes)}`,
  };
};

// Recibe fecha (YYYY-MM-DD) y hora (HH:mm) de Bolivia y devuelve el instante en ISO UTC.
export const toUtcIso = (boliviaDate: string, boliviaTime: string): string => {
  const dateMatch = DATE_PATTERN.exec(boliviaDate);
  const timeMatch = TIME_PATTERN.exec(boliviaTime);
  if (!dateMatch || !timeMatch) {
    throw new RangeError(
      `Fecha u hora inválida: ${boliviaDate} ${boliviaTime}`,
    );
  }

  const [, year, month, day] = dateMatch.map(Number);
  const [, hours, minutes] = timeMatch.map(Number);
  const shifted = new Date(Date.UTC(year, month - 1, day, hours, minutes));

  // Date.UTC acepta valores fuera de rango (ej. 31 de febrero) y los desborda.
  const isSameDate =
    shifted.getUTCFullYear() === year &&
    shifted.getUTCMonth() === month - 1 &&
    shifted.getUTCDate() === day;
  if (!isSameDate || hours > 23 || minutes > 59) {
    throw new RangeError(
      `Fecha u hora inválida: ${boliviaDate} ${boliviaTime}`,
    );
  }

  return new Date(shifted.getTime() - BOLIVIA_OFFSET_MS).toISOString();
};

// Semana de lunes 00:00 a domingo 23:59:59.999 en Bolivia, expresada en UTC.
export const getWeekRange = (reference: DateInput): WeekRange => {
  const shifted = toBoliviaShifted(reference).getTime();
  const dayStart = shifted - (((shifted % DAY_MS) + DAY_MS) % DAY_MS);
  const daysSinceMonday = (new Date(dayStart).getUTCDay() + 6) % 7;
  const weekStart = dayStart - daysSinceMonday * DAY_MS - BOLIVIA_OFFSET_MS;

  return {
    startAt: new Date(weekStart).toISOString(),
    endAt: new Date(weekStart + WEEK_MS - 1).toISOString(),
  };
};

export const addWeeks = (value: DateInput, amount: number): string =>
  new Date(toTimestamp(value) + amount * WEEK_MS).toISOString();

export const formatBlockRange = (
  startAt: DateInput,
  endAt: DateInput,
): string => `${toBoliviaTime(startAt).time} - ${toBoliviaTime(endAt).time}`;
