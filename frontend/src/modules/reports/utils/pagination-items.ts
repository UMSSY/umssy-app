import type { PaginationItem } from "../types/pagination-item.types";

function range(start: number, end: number): number[] {
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

export function getPaginationItems(currentPage: number, totalPages: number): PaginationItem[] {
  if (totalPages <= 0) return [];

  if (totalPages <= 5) {
    return range(1, totalPages);
  }

  if (currentPage < 4) {
    return [...range(1, 4), "ellipsis-end", totalPages];
  }

  if (currentPage > totalPages - 4 + 1) {
    return [1, "ellipsis-start", ...range(totalPages - 4 + 1, totalPages)];
  }

  return [1, "ellipsis-start", currentPage - 1, currentPage, currentPage + 1, "ellipsis-end", totalPages];
}
