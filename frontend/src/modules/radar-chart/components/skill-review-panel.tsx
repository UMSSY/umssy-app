'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ConfirmActionDialog } from '@/shared/components/confirm-action-dialog';
import {
  useRadarReviews,
  useRadarReviewMutations,
  useRadarReviewOperationRecovery,
} from '../hooks/use-radar-integration-queries';
import type { ReviewRow } from '../types/review-row.types';

import type { RadarReviewDecision as SkillDecision } from '../types/radar-review-decision.types';
import type { SkillReviewFilter as SkillFilter } from '../types/skill-review-filter.types';
import type { SkillReviewConfirmation as Confirmation } from '../types/skill-review-confirmation.types';
import { cn } from '@/lib/utils';

function formatEvidence(value: unknown): string {
  if (value === null || value === undefined || value === '') {
    return 'Sin evidencias registradas';
  }

  if (typeof value === 'string') {
    return value;
  }

  if (Array.isArray(value) && value.length === 0) {
    return 'Sin evidencias registradas';
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return 'No se pudieron mostrar las evidencias';
  }
}

export function SkillReviewPanel() {
  useRadarReviewOperationRecovery('skill');
  const queue = useRadarReviews();
  const { decision } = useRadarReviewMutations();

  const [filter, setFilter] = useState<SkillFilter>('pending');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [error, setError] = useState('');

  const skillRows = useMemo(
    () => (queue.data ?? []).filter((row) => row.type === 'skill'),
    [queue.data],
  );

  const rows = useMemo(
    () =>
      skillRows.filter((row) =>
        filter === 'all' ? true : row.status === filter,
      ),
    [skillRows, filter],
  );

  const selected: ReviewRow | undefined =
    rows.find((row) => row.id === selectedId) ?? rows[0];

  function requestDecision(row: ReviewRow, nextDecision: SkillDecision) {
    setError('');
    setConfirmation({
      id: row.id,
      decision: nextDecision,
      title: row.title,
    });
  }

  function confirmDecision() {
    if (!confirmation) return;

    const current = confirmation;
    const rawId = current.id.replace(/^skill:/, '');

    decision.mutate(
      {
        kind: 'skill',
        id: rawId,
        decision: current.decision,
      },
      {
        onSuccess: () => {
          setConfirmation(null);
          setError('');
        },
        onError: () => {
          setError(
            'No se pudo confirmar la decision. Puedes reintentar; se conservara el identificador de la operacion.',
          );
        },
      },
    );
  }
  const busy = decision.isPending;

  return (
    <section className="rounded-xl border p-4">
      <h2 className="text-lg font-bold">Revisión de habilidades</h2>
      <p className="mt-1 text-sm text-text-secondary">
        Revisa las habilidades registradas y sus evidencias antes de resolver la
        verificación.
      </p>

      <div className="my-3 flex flex-wrap gap-2">
        {(
          [
            ['pending', 'Pendientes'],
            ['approved', 'Aprobadas'],
            ['rejected', 'Rechazadas'],
            ['all', 'Todas'],
          ] as const
        ).map(([value, label]) => (
          <Button
            key={value}
            type="button"
            variant={filter === value ? 'default' : 'outline'}
            onClick={() => {
              setFilter(value);
              setSelectedId(null);
              setError('');
            }}
          >
            {label}
          </Button>
        ))}
      </div>

      {queue.isLoading ? (
        <p>Cargando habilidades...</p>
      ) : queue.isError ? (
        <Button
          type="button"
          variant="ghost"
          onClick={() => void queue.refetch()}
        >
          No se pudo cargar la cola. Reintentar
        </Button>
      ) : !selected ? (
        <p className="py-4 text-sm text-text-secondary">
          No hay habilidades en esta categoría.
        </p>
      ) : (
        <div className="mt-3 grid gap-4 md:grid-cols-[1fr_2fr]">
          <ul className="max-h-72 space-y-2 overflow-auto">
            {rows.map((row) => (
              <li key={row.id}>
                <Button
                  type="button"
                  variant="ghost"
                  aria-pressed={selected.id === row.id}
                  className={cn(
                    'h-auto w-full justify-start p-3 text-left whitespace-normal',
                    selected.id === row.id && 'bg-interaction',
                  )}
                  onClick={() => {
                    setSelectedId(row.id);
                    setError('');
                  }}
                >
                  <span className="min-w-0">
                    <span className="block font-semibold">{row.title}</span>
                    <span className="block text-xs text-text-secondary">
                      {row.userName} · {row.status}
                    </span>
                  </span>
                </Button>
              </li>
            ))}
          </ul>

          <div className="min-w-0">
            <h3 className="font-semibold">{selected.title}</h3>
            <p className="mt-1 text-sm text-text-secondary">
              Titular: {selected.userName}
            </p>
            <p className="mt-1 text-sm text-text-secondary">
              Estado: {selected.status}
            </p>
            <p className="mt-1 text-sm text-text-secondary">
              Fecha de registro: {new Date(selected.date).toLocaleString()}
            </p>
            {selected.areaId && (
              <p className="mt-1 text-sm text-text-secondary">
                Área: {selected.areaId}
              </p>
            )}

            <div className="mt-4">
              <h4 className="text-sm font-semibold">Evidencias registradas</h4>
              <pre className="mt-2 max-h-48 overflow-auto rounded-md border bg-surface-soft p-3 text-xs break-words whitespace-pre-wrap">
                {formatEvidence(selected.evidenceRefs)}
              </pre>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {selected.status === 'pending' && (
                <>
                  <Button
                    type="button"
                    disabled={busy}
                    onClick={() => requestDecision(selected, 'approved')}
                  >
                    Aprobar habilidad
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={busy}
                    onClick={() => requestDecision(selected, 'rejected')}
                  >
                    Rechazar habilidad
                  </Button>
                </>
              )}

              {selected.status === 'approved' && (
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy}
                  onClick={() => requestDecision(selected, 'revoked')}
                >
                  Revocar aprobación
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {error && (
        <p className="mt-3 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <ConfirmActionDialog
        open={!!confirmation}
        title="Confirmar decisión"
        description={
          confirmation
            ? `${confirmation.decision === 'approved' ? 'Aprobar' : confirmation.decision === 'rejected' ? 'Rechazar' : 'Revocar la aprobación de'} ${confirmation.title}?`
            : ''
        }
        busy={busy}
        onOpenChange={(open) => {
          if (!open && !busy) setConfirmation(null);
        }}
        onConfirm={confirmDecision}
      />
    </section>
  );
}
