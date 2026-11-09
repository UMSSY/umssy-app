import { toBoliviaTime } from "@/shared/utils/date-time";

import { pad } from "./pad";

export const toCalendarDate = (date: string): Date => {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day);
};

export const toDateString = (date: Date): string =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export const formatDayAndMonth = (date: string): string => {
  const [year, month, day] = date.split("-").map(Number);
  const value = new Date(Date.UTC(year, month - 1, day));
  const weekday = value.toLocaleDateString("es-BO", { weekday: "long", timeZone: "UTC" });
  const monthName = value.toLocaleDateString("es-BO", { month: "long", timeZone: "UTC" });
  return `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)} ${day} de ${monthName}`;
};

export const formatLongDate = (date: string): string =>
  `${formatDayAndMonth(date)} de ${date.split("-")[0]}`;

export const getBoliviaToday = (): Date => toCalendarDate(toBoliviaTime(new Date()).date);

export const addDaysToDateString = (date: string, days: number): string => {
  const value = toCalendarDate(date);
  value.setDate(value.getDate() + days);
  return toDateString(value);
};
