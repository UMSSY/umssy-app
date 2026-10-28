import { Progress } from '@/components/ui/progress';
import type { ProposalProgressProps } from '../types/proposal-progress-props.types';


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
        <span className="text-notice-foreground">{percent}%</span>
      </div>
      <Progress
        value={percent}
        aria-label={`Apoyos para ${event.title}`}
        className="[&_[data-slot=progress-indicator]]:bg-notice-foreground [&_[data-slot=progress-track]]:h-2"
      />
      <p className="text-text-secondary">
        {isExpired
          ? 'Fecha límite superada · vencida automáticamente'
          : remaining === 0
            ? 'Se alcanzó la meta de apoyos.'
            : `Faltan ${remaining} apoyos para publicar el taller.`}
      </p>
    </div>
  );
}
