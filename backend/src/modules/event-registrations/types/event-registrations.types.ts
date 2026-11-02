export interface MyRegistrationResponse {
  id: string;
  eventName: string;
  date: Date;
  startTime: Date;
  endTime: Date;
  location: string;
  status: string;
  registeredAt: string;
  cancelledAt: string | null;
}

export interface CreateEventRegistrationPayload {
  eventId: string;
  userId: string;
  statusId: string;
}

export interface PersistEventRegistrationPayload
  extends CreateEventRegistrationPayload {
  qrToken: string;
}
