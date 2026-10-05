import { Check } from 'lucide-react';
import type {
  RequestTimelineProps,
  TimelineStageState,
} from '../types/request-status.types';

const MARKER_CLASSES: Record<TimelineStageState, string> = {
  completed: 'bg-[#0B1F2E] text-white',
  current: 'border-2 border-[#E30613] bg-white',
  pending: 'border-2 border-[#C9CFD8] bg-white',
};

const LABEL_CLASSES: Record<TimelineStageState, string> = {
  completed: 'font-semibold text-[#33465A]',
  current: 'font-bold text-[#0B1F2E]',
  pending: 'font-semibold text-[#5B6470]',
};

function getStageCaption(
  state: TimelineStageState,
  occurredAtLabel: string | null,
): string {
  if (occurredAtLabel) return occurredAtLabel;
  return state === 'current' ? 'En curso' : 'Pendiente';
}

export function RequestTimeline({ stages }: RequestTimelineProps) {
  return (
    <ol aria-label="Línea de tiempo de la solicitud">
      {stages.map((stage, index) => {
        const isLast = index === stages.length - 1;

        return (
          <li
            key={stage.id}
            className="relative flex gap-4 pb-8 last:pb-0"
            aria-current={stage.state === 'current' ? 'step' : undefined}
          >
            {!isLast && (
              <span
                aria-hidden="true"
                className={`absolute bottom-0 left-[15px] top-8 w-px ${
                  stage.state === 'completed' ? 'bg-[#0B1F2E]' : 'bg-[#C9CFD8]'
                }`}
              />
            )}

            <span
              className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${MARKER_CLASSES[stage.state]}`}
            >
              {stage.state === 'completed' && (
                <Check className="h-4 w-4" aria-hidden="true" />
              )}
              {stage.state === 'current' && (
                <span className="h-2.5 w-2.5 rounded-full bg-[#E30613]" />
              )}
            </span>

            <div className="pt-1">
              <p className={`text-[15px] leading-tight ${LABEL_CLASSES[stage.state]}`}>
                {stage.label}
              </p>
              {stage.occurredAt ? (
                <time
                  dateTime={stage.occurredAt}
                  className="mt-1 block text-[12.5px] text-[#5B6470]"
                >
                  {getStageCaption(stage.state, stage.occurredAtLabel)}
                </time>
              ) : (
                <p className="mt-1 text-[12.5px] text-[#5B6470]">
                  {getStageCaption(stage.state, null)}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
