import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Pagination, PaginationContent, PaginationItem } from "@/components/ui/pagination";
import type { JobOffersPaginationProps } from "../types/job-offers-pagination-props.types";

export function JobOffersPagination({ currentPage, totalPages, onPageChange }: JobOffersPaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <Pagination aria-label="Paginación de vacantes">
      <PaginationContent className="gap-3">
        <PaginationItem>
          <Button
            type="button"
            variant="outline"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
            className="max-md:min-h-11"
          >
            <ChevronLeft aria-hidden="true" />
            Anterior
          </Button>
        </PaginationItem>
        <PaginationItem aria-live="polite" className="text-sm text-text-secondary">
          Página {currentPage} de {totalPages}
        </PaginationItem>
        <PaginationItem>
          <Button
            type="button"
            variant="outline"
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            className="max-md:min-h-11"
          >
            Siguiente
            <ChevronRight aria-hidden="true" />
          </Button>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
