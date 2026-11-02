import { BOLIVIA_TIME_ZONE } from "../constants/audit-log.constants";

// en-CA da la fecha como AAAA-MM-DD
const BOLIVIA_DATE = new Intl.DateTimeFormat("en-CA", { timeZone: BOLIVIA_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" });

const pad = (value: number) => String(value).padStart(2, "0");

// Período por defecto: del primer al último día del mes en curso, en hora de Bolivia
export function getCurrentMonthPeriod(now: Date = new Date()): { from: string; to: string } {
  const [year, month] = BOLIVIA_DATE.format(now).split("-").map(Number);
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return { from: `${year}-${pad(month)}-01`, to: `${year}-${pad(month)}-${pad(lastDay)}` };
}
