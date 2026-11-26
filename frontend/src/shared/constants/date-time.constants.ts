export const BOLIVIA_TIME_ZONE = "America/La_Paz";
export const BOLIVIA_UTC_OFFSET_MINUTES = -240;

export const MINUTE_MS = 60_000;
export const HOUR_MS = 60 * MINUTE_MS;
export const DAY_MS = 24 * HOUR_MS;
export const WEEK_MS = 7 * DAY_MS;
export const BOLIVIA_OFFSET_MS = BOLIVIA_UTC_OFFSET_MINUTES * MINUTE_MS;

export const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
export const TIME_PATTERN = /^(\d{2}):(\d{2})$/;

export const BOLIVIA_TIME_LABEL = "Hora de Bolivia (GMT-4)";

export const BOLIVIA_WEEKDAY_SHORT_LABELS = [
  "LUN",
  "MAR",
  "MIÉ",
  "JUE",
  "VIE",
  "SÁB",
  "DOM",
] as const;

export const BOLIVIA_MONTH_SHORT_LABELS = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
] as const;

export const BOLIVIA_MONTH_LABELS = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
] as const;
