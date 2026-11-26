import type { PublicEventsGridProps } from "../types/public-events-grid-props.types";
import { PublicEventCard } from "./public-event-card";

export function PublicEventsGrid({ events, showCover = false }: PublicEventsGridProps) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {events.map((event) => (
        <PublicEventCard key={event.id} event={event} showCover={showCover} />
      ))}
    </div>
  );
}
