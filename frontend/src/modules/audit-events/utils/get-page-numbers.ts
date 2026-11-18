type PageNumber = number | "ellipsis-start" | "ellipsis-end";

function range(start: number, end: number): number[] {
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

// Números visibles de la paginación con puntos suspensivos cuando hay muchas páginas
export function getPageNumbers(currentPage: number, totalPages: number): PageNumber[] {
  if (totalPages <= 7) return range(1, totalPages);
  if (currentPage < 5) return [...range(1, 5), "ellipsis-end", totalPages];
  if (currentPage > totalPages - 5 + 1) {
    return [1, "ellipsis-start", ...range(totalPages - 5 + 1, totalPages)];
  }
  return [1, "ellipsis-start", currentPage - 1, currentPage, currentPage + 1, "ellipsis-end", totalPages];
}
