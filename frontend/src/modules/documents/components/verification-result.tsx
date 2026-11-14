import {
  CheckCircle2,
  Check,
  FileText,
  ChevronRight,
  CloudUpload,
  Cpu,
  Info,
  ShieldCheck,
  Target,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { formatFileSize } from '@/modules/profile';
import {
  isApproved,
  verificationLabels,
  type DocumentVerification,
} from '../types/document-verification.types';
const areas: Record<string, string> = {
  desarrollo: 'Desarrollo',
  'cloud-devops': 'Cloud/DevOps',
  'data-ai': 'Data/IA',
  qa: 'QA',
  ciberseguridad: 'Ciberseguridad',
  'gobernanza-ti': 'Gobernanza TI',
};
export function VerificationBadge({ doc }: { doc: DocumentVerification }) {
  const color = isApproved(doc.status)
    ? 'bg-green-100 text-green-900'
    : doc.status === 'review'
      ? 'bg-amber-100 text-amber-900'
      : ['low_confidence', 'manual_rejected'].includes(doc.status)
        ? 'bg-red-100 text-red-900'
        : 'bg-blue-50 text-blue-900';
  return (
    <span className={`rounded-md px-2 py-1 text-xs font-semibold ${color}`}>
      {verificationLabels[doc.status]}
    </span>
  );
}
const confidence = (doc: DocumentVerification) =>
  doc.confidence === null
    ? 'Sin medición'
    : new Intl.NumberFormat('es-BO', {
        style: 'percent',
        maximumFractionDigits: 1,
      }).format(doc.confidence);
const radarDone = (doc: DocumentVerification) =>
  doc.synced && isApproved(doc.status) && doc.radarVersion !== null;
export function VerificationResult({
  doc,
  details,
}: {
  doc: DocumentVerification | undefined;
  details: () => void;
}) {
  return (
    <>
      <section
        className={`grid items-center gap-3 rounded-xl border p-4 sm:grid-cols-[7rem_1fr] ${doc && isApproved(doc.status) ? 'border-green-100 bg-green-50/60' : 'bg-surface-soft'}`}
      >
        <h2 className="flex items-center justify-center gap-2 text-center font-bold sm:flex-col sm:self-stretch sm:border-r sm:pr-3">
          <CheckCircle2
            size={30}
            className={
              doc && isApproved(doc.status) ? 'text-green-700' : 'text-primary'
            }
          />
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
              <dd>{confidence(doc)}</dd>
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
                {radarDone(doc)
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
export function VerificationFlow({
  doc,
}: {
  doc: DocumentVerification | undefined;
}) {
  const steps = [
    ['Documento subido', CloudUpload],
    ['OCR / NLP procesado', Cpu],
    ['Validación automática', ShieldCheck],
    ['Radar actualizado', Target],
  ] as const;
  const progress = doc ? (radarDone(doc) ? 4 : doc.decidedAt ? 3 : 1) : 0;
  return (
    <>
      <section className="rounded-xl border p-4">
        <h2 className="font-bold">Flujo de verificación automática</h2>
        <ol className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {steps.map(([label, Icon], i) => (
            <li
              key={label}
              className="relative text-center text-xs font-semibold"
            >
              {i < 3 && (
                <span
                  aria-hidden="true"
                  className={`absolute top-5 left-1/2 hidden h-px w-full sm:block ${i + 1 < progress ? 'bg-green-600' : 'bg-border'}`}
                />
              )}
              <span
                className={`relative mx-auto mb-2 flex size-10 items-center justify-center rounded-full ${i < progress ? 'bg-green-100 text-green-800' : 'bg-muted text-muted-foreground'}`}
              >
                <Icon size={20} />
                {i < progress && (
                  <Check
                    size={15}
                    className="absolute -right-1 -bottom-1 rounded-full bg-green-700 p-0.5 text-white"
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
      <p className="flex items-start gap-2 rounded-lg bg-blue-50 p-3 text-sm">
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
}: {
  doc: DocumentVerification | null;
  close: () => void;
  view: (doc: DocumentVerification) => void;
}) {
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
        <DialogDescription className="flex items-center gap-4 rounded-lg border bg-blue-50/50 p-4 text-ink">
          <FileText className="size-10 shrink-0 rounded-lg bg-blue-100 p-2 text-primary" />
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
          <strong>Confianza OCR: {confidence(doc)}</strong>
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
                <span className="rounded bg-blue-50 px-2 py-1">
                  {areas[skill.areaId] ?? skill.areaId}
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
        <div className="rounded-lg bg-blue-50 p-3">
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
