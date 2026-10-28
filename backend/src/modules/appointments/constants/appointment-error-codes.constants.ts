export const APPOINTMENT_ERROR_CODES = {
  appointmentNotFound: 'APPOINTMENT_NOT_FOUND',
  appointmentNotOwned: 'APPOINTMENT_NOT_OWNED',
  blockAlreadyBooked: 'BLOCK_ALREADY_BOOKED',
  blockInPast: 'BLOCK_IN_PAST',
  invalidOrientationType: 'INVALID_ORIENTATION_TYPE',
  mentorUnavailable: 'MENTOR_UNAVAILABLE',
  ownBlock: 'OWN_BLOCK',
} as const;
