import {
  CheckCircle2,
  Check,
  FileText,
  ChevronRight,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { formatFileSize } from '@/modules/profile';
import { isApproved } from '../utils/is-approved';
import { verificationLabels } from '../constants/verification-labels.constants';
import { formatVerificationConfidence } from '../utils/format-verification-confidence';
import { hasPublishedVerification } from '../utils/has-published-verification';
import { VERIFICATION_FLOW_STEPS } from '../constants/verification-flow-steps.constants';
import { getRadarAreaName } from '@/modules/radar-chart';
import { cn } from '@/lib/utils';
import type { VerificationBadgeProps } from '../types/verification-badge-props.types';
import type { VerificationResultProps } from '../types/verification-result-props.types';
import type { VerificationFlowProps } from '../types/verification-flow-props.types';
import type { VerificationDetailProps } from '../types/verification-detail-props.types';
export function VerificationBadge({ doc }: VerificationBadgeProps) {
  return (
    <span className="rounded-md bg-surface-soft px-2 py-1 text-xs font-semibold text-ink">
      {verificationLabels[doc.status]}
    </span>
  );
}
export function VerificationResult({ doc, details }: VerificationResultProps) {
  return (
    <>
      <section className="grid items-center gap-3 rounded-xl border bg-surface-soft p-4 sm:grid-cols-[7rem_1fr]">
        <h2 className="flex items-center justify-center gap-2 text-center font-bold sm:flex-col sm:self-stretch sm:border-r sm:pr-3">
          <CheckCircle2 size={30} className="text-primary" />
          Resultado del análisis
        </h2>
        <div>
          {doc ? (
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
              <dt>Estado</dt>
              <dd>
                <VerificationBadge doc={doc} />
              </dd>
              <dt>Confianza OCR</dt>
              <dd>{formatVerificationConfidence(doc)}</dd>
              <dt>Habilidades detectadas</dt>
              <dd>
                {doc.skills
                  .slice(0, 20)
                  .map((s) => s.name)
                  .join(', ') + (doc.skills.length > 20 ? '…' : '') ||
                  'Sin habilidades registradas'}
              </dd>
              <dt>Acción</dt>
              <dd>
                {hasPublishedVerification(doc)
                  ? 'Radar actualizado automáticamente'
                  : doc.reason || 'Análisis pendiente'}
              </dd>
            </dl>
          ) : (
            <dl className="flex gap-4 text-sm">
              <dt>Confianza OCR</dt>
              <dd>0%</dd>
            </dl>
          )}
          {doc?.decidedAt && (
            <div className="mt-3 flex justify-end">
              <Button variant="outline" onClick={details}>
                Ver detalle del análisis <ChevronRight size={16} />
              </Button>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
export function VerificationFlow({ doc }: VerificationFlowProps) {
  const progress = doc
    ? hasPublishedVerification(doc)
      ? 4
      : doc.decidedAt
        ? 3
        : 1
    : 0;
  return (
    <>
      <section className="rounded-xl border p-4">
        <h2 className="font-bold">Flujo de verificación automática</h2>
        <ol className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {VERIFICATION_FLOW_STEPS.map(([label, Icon], i) => (
            <li
              key={label}
              className="relative text-center text-xs font-semibold"
            >
              {i < 3 && (
                <span
                  aria-hidden="true"
                  className={cn(
                    'absolute top-5 left-1/2 hidden h-px w-full sm:block',
                    i + 1 < progress ? 'bg-accent' : 'bg-border',
                  )}
                />
              )}
              <span
                className={cn(
                  'relative mx-auto mb-2 flex size-10 items-center justify-center rounded-full',
                  i < progress
                    ? 'bg-accent text-accent-foreground'
                    : 'bg-muted text-muted-foreground',
                )}
              >
                <Icon size={20} />
                {i < progress && (
                  <Check
                    size={15}
                    className="absolute -right-1 -bottom-1 rounded-full bg-accent p-0.5 text-accent-foreground"
                  />
                )}
              </span>
              {label}
              <span className="sr-only">
                {i < progress ? ' completado' : ' pendiente'}
              </span>
            </li>
          ))}
        </ol>
      </section>
      <p className="flex items-start gap-2 rounded-lg bg-surface-soft p-3 text-sm">
        <Info size={18} className="shrink-0" />
        Los documentos con inconsistencias pasan a revisión administrativa. Si
        la lectura queda por debajo del mínimo, puedes subir una nueva versión.
      </p>
    </>
  );
}
export function VerificationDetail({
  doc,
  close,
  view,
}: VerificationDetailProps) {
  if (!doc) return null;
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogTitle className="text-2xl font-bold">
          Detalle del análisis
        </DialogTitle>
        <DialogDescription className="flex items-center gap-4 rounded-lg border bg-surface-soft p-4 text-ink">
          <FileText className="size-10 shrink-0 rounded-lg bg-muted p-2 text-primary" />
          <span>
            <strong className="block text-base">{doc.filename}</strong>Subido el{' '}
            {new Date(doc.createdAt).toLocaleString('es-BO')}
            <span className="block">
              {doc.mime.split('/').at(-1)?.toUpperCase()} ·{' '}
              {formatFileSize(doc.sizeBytes)}
            </span>
          </span>
        </DialogDescription>
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
          <VerificationBadge doc={doc} />{' '}
          <strong>Confianza OCR: {formatVerificationConfidence(doc)}</strong>
        </div>
        <h3 className="font-bold">Habilidades detectadas</h3>
        <ul className="divide-y rounded-lg border px-3">
          {doc.skills.map((skill) => (
            <li
              key={skill.id}
              className="grid grid-cols-3 items-center gap-2 py-2"
            >
              <strong>{skill.name}</strong>
              <span>
                Área:{' '}
                <span className="rounded bg-surface-soft px-2 py-1">
                  {getRadarAreaName(skill.areaId)}
                </span>
              </span>
              <span>
                {doc.publishedIds.includes(skill.id)
                  ? 'Aprobado'
                  : isApproved(doc.status) && !doc.synced
                    ? 'Pendiente de publicación'
                    : 'Sin aporte publicado'}
              </span>
            </li>
          ))}
        </ul>
        {!doc.skills.length && <p>Sin habilidades detectadas.</p>}
        <div className="rounded-lg bg-surface-soft p-3">
          <h3 className="font-bold">Observaciones del análisis</h3>
          <p>
            {doc.reason ===
            'El documento supera la extensión admitida por el análisis NLP.'
              ? 'El OCR extrajo más de 20.000 caracteres. El análisis de habilidades admite hasta 20.000 por documento. Por eso se omitió la detección y se solicitó revisión administrativa.'
              : doc.reason || 'Análisis en curso.'}
          </p>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={close}>
            Cerrar
          </Button>
          <Button disabled={!doc.available} onClick={() => view(doc)}>
            {doc.available ? 'Ver documento' : 'Documento no disponible'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
