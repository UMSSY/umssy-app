
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/components/ui/pagination";

interface MentorDirectoryPaginationProps {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function MentorDirectoryPagination({
  page,
  pageSize,
  totalItems,
  totalPages,
  onPageChange,
}: MentorDirectoryPaginationProps) {
  if (totalItems <= 0 || totalPages <= 0 || pageSize <= 0) {
    return null;
  }

  const firstItem = (page - 1) * pageSize + 1;
  const lastItem = Math.min(page * pageSize, totalItems);

  const visiblePageCount = Math.min(3, totalPages);
  const firstVisiblePage = Math.min(
    Math.max(page - 1, 1),
    totalPages - visiblePageCount + 1,
  );

  const visiblePages = Array.from(
    { length: visiblePageCount },
    (_, index) => firstVisiblePage + index,
  );

  return (
    <section
      className="flex flex-col items-center gap-3"
      aria-label="Paginación del directorio de mentores"
    >
      <p className="text-sm text-muted-foreground" aria-live="polite">
        Mostrando {firstItem}–{lastItem} de {totalItems} mentores
      </p>

      <Pagination aria-label="Páginas de mentores" className="mx-0 w-auto">
        <PaginationContent className="flex-wrap justify-center gap-2">
          {totalPages > 1 && (
            <PaginationItem>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 1}
                aria-label="Página anterior"
              >
                Anterior
              </Button>
            </PaginationItem>
          )}

          {visiblePages.map((pageNumber) => {
            const isCurrentPage = pageNumber === page;

            return (
              <PaginationItem key={pageNumber}>
                <Button
                  type="button"
                  variant={isCurrentPage ? "outline" : "ghost"}
                  size="icon"
                  onClick={() => {
                    if (!isCurrentPage) {
                      onPageChange(pageNumber);
                    }
                  }}
                  aria-label={`Página ${pageNumber}`}
                  aria-current={isCurrentPage ? "page" : undefined}
                >
                  {pageNumber}
                </Button>
              </PaginationItem>
            );
          })}

          {totalPages > 1 && (
            <PaginationItem>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onPageChange(page + 1)}
                disabled={page >= totalPages}
                aria-label="Página siguiente"
              >
                Siguiente
              </Button>
            </PaginationItem>
          )}
        </PaginationContent>
      </Pagination>
    </section>
  );
}
