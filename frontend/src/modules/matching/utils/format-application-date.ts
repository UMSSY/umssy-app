const APPLICATION_DATE_FORMAT = new Intl.DateTimeFormat("es-BO", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export function formatApplicationDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return isoDate;
  return APPLICATION_DATE_FORMAT.format(date).replace(/\./g, "").replace(/ de /g, " ");
}
