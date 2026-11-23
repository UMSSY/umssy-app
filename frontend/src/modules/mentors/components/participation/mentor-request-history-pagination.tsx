import { Button } from '@/components/ui/button';

type MentorRequestHistoryPaginationProps = {
  currentPage: number;
  totalPages: number;
  totalRequests: number;
  pageSize: number;
  visibleItems: number;
  isLoading: boolean;
  onPageChange: (page: number) => void;
};

export function MentorRequestHistoryPagination({
  currentPage,
  totalPages,
  totalRequests,
  pageSize,
  visibleItems,
  isLoading,
  onPageChange,
}: MentorRequestHistoryPaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const startIndex = (currentPage - 1) * pageSize;
  const firstVisible = startIndex + 1;
  const lastVisible = Math.min(
    startIndex + visibleItems,
    totalRequests,
  );

  const pages = Array.from(
    { length: totalPages },
    (_, index) => index + 1,
  );

  return (
    <nav
      aria-label="Paginación del historial de solicitudes"
      className="mt-6 flex flex-col items-center gap-3 border-t pt-4"
    >
      <p
        role="status"
        className="text-sm text-muted-foreground"
      >
        Mostrando {firstVisible}–{lastVisible} de {totalRequests}{' '}
        solicitudes
      </p>

      <div className="flex items-center justify-center gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={currentPage === 1 || isLoading}
          onClick={() => onPageChange(currentPage - 1)}
        >
          Anterior
        </Button>

        {pages.map((page) => {
          const isCurrent = page === currentPage;

          return (
            <Button
              key={page}
              type="button"
              variant={isCurrent ? 'outline' : 'ghost'}
              size="icon"
              disabled={isLoading}
              aria-label={`Página ${page}`}
              aria-current={isCurrent ? 'page' : undefined}
              onClick={() => onPageChange(page)}
              className={
                isCurrent
                  ? 'font-semibold shadow-sm'
                  : 'font-normal'
              }
            >
              {page}
            </Button>
          );
        })}

        <Button
          type="button"
          variant="outline"
          disabled={currentPage >= totalPages || isLoading}
          onClick={() => onPageChange(currentPage + 1)}
        >
          Siguiente
        </Button>
      </div>
    </nav>
  );
}
