export { EventsView } from './views/events-view';
export { ProposeWorkshopView } from './views/propose-workshop-view';
export { EventCard } from './components/event-card';
export { EventDetailPanel } from './components/event-detail-panel';
export { useEvents } from './hooks/use-events';
export { useProposalSupport } from './hooks/use-proposal-support';
export { eventsService } from './services/events.service';
export type {
  EventCardProps,
  EventCategoryItem,
  EventCapacityStatus,
  EventItem,
  EventsListResponse,
  GetEventsParams,
} from './types/event.types';

export { PublicEventsSection } from "./components/public-events-section";
export { PublicWorkshopsView } from "./views/public-workshops-view";
export { PublicWorkshopDetailView } from "./views/public-workshop-detail-view";

export { MyPassesView } from "./views/my-passes-view";

export { readRecord, readArray, readString } from "./utils/response-validation";
export { REQUEST_TIMEOUT_MS } from "./constants/events.constants";
export {
  registrationsService,
  useRegistration,
  useRegistrationActions,
  REGISTRATION_ERROR_MESSAGES,
  getRegistrationErrorMessage,
} from '@/modules/registrations';
export type {
  RegistrationResponse,
  RegistrationErrorCode,
} from '@/modules/registrations';
