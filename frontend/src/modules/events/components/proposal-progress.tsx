import type { EventItem } from '../types/event-item.types';

interface ProposalProgressProps {
  event: EventItem;
  isExpired?: boolean;
}

export function ProposalProgress({ event, isExpired = false }: ProposalProgressProps) {
  const count = event.supportCount;
  const threshold = event.supportThreshold;

  if (count === undefined || threshold === undefined || threshold === null || threshold <= 0) {
    return <p className="text-xs text-text-secondary">Información de apoyos no disponible.</p>;
  }

  const percent = event.progressPercent ?? Math.min(100, Math.round((count / threshold) * 100));
  const remaining = event.supportsRemaining ?? Math.max(0, threshold - count);

  return (
    <div className="space-y-1.5 text-xs">
      <div className="flex items-center justify-between gap-2 font-semibold text-ink">
        <span>{count} de {threshold} apoyos</span>
        <span className="text-orange-700">{percent}%</span>
      </div>
      <div
        role="progressbar"
        aria-label={`Apoyos para ${event.title}`}
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-2 overflow-hidden rounded-full bg-surface-soft"
      >
        <div
          className="h-full rounded-full bg-orange-500 transition-[width]"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="text-text-secondary">
        {isExpired
          ? 'El plazo de apoyo terminó.'
          : remaining === 0
            ? 'Se alcanzó la meta de apoyos.'
            : `Faltan ${remaining} apoyos para publicar el taller.`}
      </p>
    </div>
  );
}
