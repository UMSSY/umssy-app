import { FIXTURE_PDF } from '../../../common/constants/seed-fixture-document.constants.js';
import { FIXTURE_APPOINTMENT_DOCUMENT } from '../constants/seed-fixture-appointments.constants.js';
import type { Prisma } from '../../../prisma/client.js';

export async function seedAppointmentDocumentFixture(
  tx: Prisma.TransactionClient,
  appointmentId: string,
): Promise<void> {
  await tx.appointmentDocument.upsert({
    where: { appointmentId },
    create: {
      appointmentId,
      ...FIXTURE_APPOINTMENT_DOCUMENT,
      sizeBytes: FIXTURE_PDF.length,
      data: FIXTURE_PDF,
    },
    update: {},
  });
}
