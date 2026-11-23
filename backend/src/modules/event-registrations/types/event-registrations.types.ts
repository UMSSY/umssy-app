export interface MyRegistrationResponse {
  id: string;
  eventId: string;
  eventName: string;
  date: Date;
  startTime: Date;
  endTime: Date;
  location: string;
  status: string;
  registeredAt: string;
  cancelledAt: string | null;
}

export interface MyRegistrationsListResponse {
  data: {
    items: MyRegistrationResponse[];
    total: number;
    limit: number;
    totalPages: number;
  };
  page: number;
  offset: number;
}

export interface CreateEventRegistrationPayload {
  eventId: string;
  userId: string;
  statusId: string;
}

export interface PersistEventRegistrationPayload extends CreateEventRegistrationPayload {
  qrToken: string;
}
