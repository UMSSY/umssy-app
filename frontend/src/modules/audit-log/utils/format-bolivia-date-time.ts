import { BOLIVIA_TIME_ZONE } from "../constants/audit-log.constants";

const DATE_FORMAT = new Intl.DateTimeFormat("es-BO", { timeZone: BOLIVIA_TIME_ZONE, day: "2-digit", month: "2-digit", year: "numeric" });
const TIME_FORMAT = new Intl.DateTimeFormat("es-BO", { timeZone: BOLIVIA_TIME_ZONE, hour: "2-digit", minute: "2-digit", hourCycle: "h23" });

// Siempre en hora de Bolivia, sin depender de la zona configurada en el dispositivo
export function formatBoliviaDateTime(iso: string): { date: string; time: string } | null {
  const value = new Date(iso);
  if (Number.isNaN(value.getTime())) return null;
  return { date: DATE_FORMAT.format(value), time: TIME_FORMAT.format(value) };
}
