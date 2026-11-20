export const DEFAULT_APPOINTMENTS_PAGE = 1;

export const APPOINTMENTS_PAGINATION_TEXT = {
  ariaLabel: "Paginación de citas",
  previous: "Anterior",
  next: "Siguiente",
  summary: (from: number, to: number, total: number) =>
    `Mostrando ${from}–${to} de ${total} citas`,
  pageOf: (page: number, totalPages: number) => `Página ${page} de ${totalPages}`,
} as const;
