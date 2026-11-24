import { formatSessionDate, formatSessionTimeRange } from '../utils/event-sessions';
import type { EventSessionsListProps } from '../types/event-sessions-list-props.types';

// Cronograma de un taller con varias sesiones: fecha y horario por línea.
export function EventSessionsList({ sessions, titleId }: EventSessionsListProps) {
  return (
    <section aria-labelledby={titleId} className="space-y-2">
      <h3
        id={titleId}
        className="text-xs font-semibold tracking-wide text-text-secondary uppercase"
      >
        Sesiones
      </h3>
      <ol className="space-y-2">
        {sessions.map((session, index) => (
          <li
            key={session.id}
            className="flex gap-3 rounded-md border border-border px-3 py-2 text-sm"
          >
            <span className="w-4 shrink-0 font-semibold text-accent tabular-nums">
              {index + 1}
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="font-medium text-ink first-letter:uppercase">
                {formatSessionDate(session)}
              </span>
              <span className="text-text-secondary">
                {formatSessionTimeRange(session)}
              </span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
