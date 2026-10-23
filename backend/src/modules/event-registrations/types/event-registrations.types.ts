export interface MyRegistrationResponse {
  id: string;
  eventName: string;
  date: Date;
  startTime: Date;
  endTime: Date;
  location: string;
  status: string;
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
