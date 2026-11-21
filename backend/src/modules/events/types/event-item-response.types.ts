import type { EventRecommendation } from './event-recommendation.types.js';
import type { EventCategoryResponse } from '../../event-categories/types/event-category-response.types.js';
import type { EventSessionResponse } from './event-session-response.types.js';

export interface EventItemResponse {
  coverUrl?: string | null;
  id: string;
  title: string;
  description: string | null;
  eventDate: string;
  startTime: string;
  endTime: string;
  location: string | null;
  sessions: EventSessionResponse[];
  capacity: number | null;
  availableSpots: number | null;
  registrationCount: number;
  instructorName: string | null;
  modalityId: string | null;
  category: EventCategoryResponse;
  statusId: string;
  status: string;
  origin: string;
  supportCount: number;
  supportThreshold: number | null;
  supportsRemaining: number | null;
  progressPercent: number | null;
  votingDeadline: string | null;
  hasSupported: boolean;
  recommendation?: EventRecommendation;
}
