import type { EventRecommendation } from './event-recommendation.types.js';
import type { EventWithRelations } from './event-with-relations.types.js';

export interface RankedEvent {
  event: EventWithRelations;
  recommendation: EventRecommendation;
}
