import type { Prisma } from '../../../prisma/client.js';
import type { BLOCK_WITH_APPOINTMENT_DETAIL_INCLUDE } from '../constants/block-query.constants.js';

export type AvailabilityBlockWithAppointmentDetail = Prisma.AvailabilityBlockGetPayload<{
  include: typeof BLOCK_WITH_APPOINTMENT_DETAIL_INCLUDE;
}>;
