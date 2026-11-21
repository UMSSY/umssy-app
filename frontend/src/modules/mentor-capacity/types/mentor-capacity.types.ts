export interface MentorCapacityOverview {
  approvedGraduates: number;
  percentage: number;
  capacity: number;
  activeMentors: number;
  reservedOffers: number;
  occupied: number;
  available: number;
  pendingRequests: number;
}

export interface MentorCapacityPage<T> {
  items: T[];
  totalItems: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface WaitingMentorRequest {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  queuedAt: string;
}

export interface MentorOfferRecord {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  status: 'OFFERED' | 'CONFIRMED' | 'EXPIRED';
  offeredAt: string;
  expiresAt: string;
  confirmedAt: string | null;
}
