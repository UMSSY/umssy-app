export interface Registration {
  id: string;
  eventId?: string;
  eventName: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  status: string;
  registeredAt?: string;
  cancelledAt?: string | null;
}
