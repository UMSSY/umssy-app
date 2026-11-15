'use client';
import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { isApiError } from '@/shared/services/api-client';
import { useRadarReviewOperationRecovery } from '../hooks/use-radar-integration-queries';
import { radarIntegrationApi } from '../services/radar-integration.service';
import {
  clearRadarReviewOperationId,
  getRadarReviewOperationId,
} from '../services/radar-review-idempotency';
import type { RadarReviewOperationResult } from '../services/radar-integration.service';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { verificationApi } from '@/modules/documents/services/document-verification.service';
import {
  verificationLabels,
  type DocumentVerification,
} from '@/modules/documents/types/document-verification.types';
import { ConfirmActionDialog } from '@/shared/components/confirm-action-dialog';

export function DocumentReviewPanel() {
  useRadarReviewOperationRecovery('cv');
  const [filter, setFilter] = useState('pending');
  const labels = {
    approved: 'Aprobar documento',
    rejected: 'Rechazar documento',
    revoke: 'Revocar aprobación',
    reprocess: 'Reprocesar archivo',
  } as const;
  type Decision = keyof typeof labels;
  const queue = useQuery({
    queryKey: ['radar-integration', 'document-reviews', filter],
    queryFn: () => verificationApi.list(true, filter),
    refetchInterval: 15000,
  });
  const [selected, setSelected] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<{
    id: string;
    decision: Decision;
    name: string;
  } | null>(null);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<{ url: string; name: string } | null>(
    null,
  );
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview.url);
    },
    [preview],
  );
  const mutation = useMutation({
    mutationFn: async ({
      id,
      decision,
    }: {
      id: string;
      decision: Decision;
    }) => {
      if (decision !== 'approved' && decision !== 'rejected') {
        return verificationApi.decide(id, decision);
      }

      const operationId = await getRadarReviewOperationId('cv', id, decision);

      let result: RadarReviewOperationResult;

      try {
        result = await radarIntegrationApi.documentOperationStatus(operationId);
      } catch (error: unknown) {
        if (!isApiError(error) || error.response?.status !== 404) {
          throw error;
        }

        result = await radarIntegrationApi.documentDecision(
          id,
          operationId,
          decision,
        );
      }

      if (
        result.operationId !== operationId ||
        result.status !== 'completed' ||
        result.kind !== 'cv' ||
        result.targetId !== id ||
        result.decision !== decision
      ) {
        throw new Error(
          'El resultado recuperado no coincide con la decision solicitada.',
        );
      }

      await clearRadarReviewOperationId('cv', id, decision, operationId);

      return result;
    },
    onSuccess: () => {
      setConfirmation(null);
      setError('');
    },
    onError: () => {
      setError(
        'No se pudo confirmar la decision. Puedes reintentar; se conservara el identificador de la operacion.',
      );
    },
    onSettled: () => queue.refetch(),
  });
  const rows = queue.data ?? [];
  const item = rows.find((d) => d.id === selected) ?? rows[0];
  const actions: Decision[] = !item
    ? []
    : item.status === 'legacy'
      ? ['reprocess']
      : ['review', 'low_confidence'].includes(item.status)
        ? ['approved', 'rejected', 'reprocess']
        : ['approved', 'manual_approved'].includes(item.status)
          ? ['revoke']
          : [];
  async function open(row: DocumentVerification) {
    try {
      const file = await verificationApi.file(row.id, true);
      setPreview({ url: URL.createObjectURL(file), name: row.filename });
      setError('');
    } catch {
      setError('El respaldo no está disponible.');
    }
  }
  return (
    <section className="rounded-xl border p-4">
      <h2 className="text-lg font-bold">Documentos que requieren revisión</h2>
      <div className="my-3 flex flex-wrap gap-2">
        {[
          ['pending', 'Pendientes'],
          ['approved', 'Aprobados'],
          ['rejected', 'Rechazados'],
          ['all', 'Todos'],
        ].map(([id, label]) => (
          <Button
            key={id}
            variant={filter === id ? 'default' : 'outline'}
            onClick={() => setFilter(id)}
          >
            {label}
          </Button>
        ))}
      </div>
      {queue.isLoading ? (
        <p>Cargando documentos…</p>
      ) : queue.isError ? (
        <Button variant="ghost" onClick={() => void queue.refetch()}>
          No se pudo cargar la cola. Reintentar
        </Button>
      ) : !item ? (
        <p>No hay documentos pendientes.</p>
      ) : (
        <div className="mt-3 grid gap-4 md:grid-cols-[1fr_2fr]">
          <ul className="max-h-60 overflow-auto">
            {rows.map((d) => (
              <li key={d.id}>
                <Button
                  variant="ghost"
                  className="p-2 text-left"
                  onClick={() => setSelected(d.id)}
                >
                  {d.ownerName} · {d.filename}
                </Button>
              </li>
            ))}
          </ul>
          <div>
            <strong>{item.filename}</strong>
            <p>
              {verificationLabels[item.status]} · {item.reason}
            </p>
            <p>
              Habilidades:{' '}
              {item.skills.map((s) => s.name).join(', ') || 'Sin detecciones'}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                variant="outline"
                disabled={!item.available}
                onClick={() => void open(item)}
              >
                {item.available ? 'Visualizar respaldo' : 'No está disponible'}
              </Button>
              {actions.map((decision) => (
                <Button
                  key={decision}
                  disabled={mutation.isPending}
                  onClick={() =>
                    setConfirmation({
                      id: item.id,
                      decision,
                      name: item.filename,
                    })
                  }
                >
                  {labels[decision]}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}
      <ConfirmActionDialog
        open={!!confirmation}
        title="Confirmar decisión"
        description={
          confirmation
            ? labels[confirmation.decision] + ' · ' + confirmation.name + '?'
            : ''
        }
        busy={mutation.isPending}
        error={error}
        onOpenChange={(v) => {
          if (!v) setConfirmation(null);
        }}
        onConfirm={() => {
          if (confirmation) mutation.mutate(confirmation);
        }}
      />
      <Dialog
        open={!!preview}
        onOpenChange={(v) => {
          if (!v) setPreview(null);
        }}
      >
        <DialogContent className="sm:max-w-3xl">
          <DialogTitle>{preview?.name}</DialogTitle>
          {preview && (
            <iframe
              title={preview.name}
              src={preview.url}
              className="h-[60vh] w-full"
            />
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
