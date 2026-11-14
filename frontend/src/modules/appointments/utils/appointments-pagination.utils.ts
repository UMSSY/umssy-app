export function getAppointmentsPageRange(
  page: number,
  pageSize: number,
  total: number,
): { from: number; to: number } {
  if (total <= 0) return { from: 0, to: 0 };
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  return { from, to };
}

export function getAppointmentsTotalPages(pageSize: number, total: number): number {
  if (pageSize <= 0) return 0;
  return Math.ceil(total / pageSize);
}
