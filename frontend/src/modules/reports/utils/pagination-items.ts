import { EDGE_BLOCK_SIZE, SIBLING_PAGES } from "../constants/table-pagination.constants";
import type { PaginationItem } from "../types/pagination-item.types";

function range(start: number, end: number): number[] {
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

// Muestra la primera y la última página, la actual con sus vecinas y el bloque de 3 del extremo
// en el que se está; los huecos se reemplazan por "…". Ejemplo con 7 páginas: "1 2 3 … 7".
export function getPaginationItems(currentPage: number, totalPages: number): PaginationItem[] {
  if (totalPages <= 0) return [];

  if (totalPages <= EDGE_BLOCK_SIZE) {
    return range(1, totalPages);
  }

  const page = Math.min(Math.max(currentPage, 1), totalPages);
  const visiblePages = new Set([1, totalPages]);

  range(Math.max(page - SIBLING_PAGES, 1), Math.min(page + SIBLING_PAGES, totalPages)).forEach((visible) =>
    visiblePages.add(visible),
  );

  if (page < EDGE_BLOCK_SIZE) {
    range(1, EDGE_BLOCK_SIZE).forEach((visible) => visiblePages.add(visible));
  }

  if (page > totalPages - EDGE_BLOCK_SIZE + 1) {
    range(totalPages - EDGE_BLOCK_SIZE + 1, totalPages).forEach((visible) => visiblePages.add(visible));
  }

  const sortedPages = [...visiblePages].sort((first, second) => first - second);
  const items: PaginationItem[] = [];

  sortedPages.forEach((visible, index) => {
    const previous = sortedPages[index - 1];

    if (previous !== undefined && visible - previous > 1) {
      items.push(visible <= page ? "ellipsis-start" : "ellipsis-end");
    }

    items.push(visible);
  });

  return items;
}
