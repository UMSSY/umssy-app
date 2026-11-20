export function formatVacancyCount(count: number | string): string {
  return `${count} ${Number(count) === 1 ? "vacante" : "vacantes"}`;
}
