'use client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { verificationLabels } from '@/modules/cv';
import { useDocumentReview } from '../hooks/use-document-review';
import { DOCUMENT_REVIEW_LABELS as labels } from '../constants/document-review-labels.constants';
import { ConfirmActionDialog } from '@/shared/components/confirm-action-dialog';

export function DocumentReviewPanel() {
  const {
    filter,
    setFilter,
    queue,
    setSelected,
    confirmation,
    setConfirmation,
    error,
    preview,
    setPreview,
    mutation,
    rows,
    item,
    actions,
    open,
  } = useDocumentReview();
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
      {error && !confirmation && <p role="alert">{error}</p>}
      <ConfirmActionDialog
        open={!!confirmation}
        title="Confirmar decisión"
        description={
          confirmation
            ? labels[confirmation.decision] + ' · ' + confirmation.name + '?'
            : ''
        }
        error={error}
        busy={mutation.isPending}
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
          <Button variant="outline" onClick={() => setPreview(null)}>
            Cerrar vista previa
          </Button>
        </DialogContent>
      </Dialog>
    </section>
  );
}
