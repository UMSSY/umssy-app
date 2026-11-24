import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MENTOR_CAPACITY_PAGE_SIZE } from '../services/mentor-capacity.service';

interface MentorCapacityPageControlsProps {
  page: number;
  totalItems: number;
  onChange: (page: number) => void;
}

export function MentorCapacityPageControls({
  page,
  totalItems,
  onChange,
}: MentorCapacityPageControlsProps) {
  const totalPages = Math.max(
    1,
    Math.ceil(totalItems / MENTOR_CAPACITY_PAGE_SIZE),
  );
  return (
    <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3 text-sm text-text-secondary">
      <span>{totalItems} registros</span>
      <div className="flex items-center gap-2">
        <Button
          aria-label="Página anterior"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
          size="sm"
          variant="outline"
        >
          <ChevronLeft aria-hidden="true" />
        </Button>
        <span>
          {page} / {totalPages}
        </span>
        <Button
          aria-label="Página siguiente"
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}
          size="sm"
          variant="outline"
        >
          <ChevronRight aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
