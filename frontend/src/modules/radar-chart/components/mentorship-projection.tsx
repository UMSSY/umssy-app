'use client';

import { Button } from '@/components/ui/button';
import { useMentorDirectory } from '@/modules/mentorship';
import type { RadarAreaScore } from '../types/radar-area-score.types';

export function MentorshipAvailability({ area }: { area: RadarAreaScore }) {
  const { data, isPending, isError, isFetching, refetch } = useMentorDirectory({
    page: 1,
    search: '',
    area: area.name,
    available: true,
    sort: 'default',
  });
  const count = data?.totalItems ?? 0;

  return (
    <div className="space-y-3 border-t border-border pt-3" aria-live="polite">
      <h3 className="text-sm font-semibold">Disponibilidad de mentoría</h3>
      {isPending ? (
        <p role="status" className="text-sm text-text-secondary">
          Consultando mentores disponibles...
        </p>
      ) : isError ? (
        <div role="alert" className="space-y-2 text-sm">
          <p>
            No pudimos comprobar la disponibilidad de mentores.
          </p>
          <Button
            variant="outline"
            size="sm"
            disabled={isFetching}
            onClick={() => {
              void refetch();
            }}
          >
            Reintentar consulta
          </Button>
        </div>
      ) : (
        <>
          <p className="text-sm">
            {count > 0
              ? `${count} ${count === 1 ? 'mentor disponible' : 'mentores disponibles'} en esta área.`
              : 'No hay mentores disponibles para esta área.'}
          </p>
        </>
      )}
    </div>
  );
}
