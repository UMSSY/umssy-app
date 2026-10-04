const MS_PER_MINUTE = 60_000;

export function formatRelativeTime(isoDate: string, now: Date = new Date()): string {
  const minutes = Math.floor((now.getTime() - new Date(isoDate).getTime()) / MS_PER_MINUTE);

  if (minutes < 1) return "hace un momento";
  if (minutes < 60) return `hace ${minutes} min`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;

  return `hace ${Math.floor(hours / 24)} d`;
}