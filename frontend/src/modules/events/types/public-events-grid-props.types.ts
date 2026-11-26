import type { EventItem } from "./event-item.types";

export interface PublicEventsGridProps {
  events: readonly EventItem[];
  showCover?: boolean;
}
