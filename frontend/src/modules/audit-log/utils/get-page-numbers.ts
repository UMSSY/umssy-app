import { EDGE_PAGE_BLOCK, MAX_VISIBLE_PAGES } from "../constants/audit-log.constants";

type PageNumber = number | "ellipsis-start" | "ellipsis-end";

function range(start: number, end: number): number[] {
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

// Números visibles de la paginación con puntos suspensivos cuando hay muchas páginas
export function getPageNumbers(currentPage: number, totalPages: number): PageNumber[] {
  if (totalPages <= MAX_VISIBLE_PAGES) return range(1, totalPages);
  if (currentPage < EDGE_PAGE_BLOCK) return [...range(1, EDGE_PAGE_BLOCK), "ellipsis-end", totalPages];
  if (currentPage > totalPages - EDGE_PAGE_BLOCK + 1) {
    return [1, "ellipsis-start", ...range(totalPages - EDGE_PAGE_BLOCK + 1, totalPages)];
  }
  return [1, "ellipsis-start", currentPage - 1, currentPage, currentPage + 1, "ellipsis-end", totalPages];
}
