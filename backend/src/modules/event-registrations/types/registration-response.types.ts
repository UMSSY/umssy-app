export interface RegistrationResponse {
  id: string;
  eventId: string;
  status: 'confirmed' | 'cancelled';
  qrToken: string;
  registeredAt: string;
  cancelledAt: string | null;
}
