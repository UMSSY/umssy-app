export const REGISTRATION_TRANSACTION_ATTEMPTS = 3;

export const REGISTRATION_SELECT = {
  id: true,
  eventId: true,
  userId: true,
  status: { select: { title: true } },
  qrToken: true,
  registeredAt: true,
  cancelledAt: true,
} as const;
