import { buildAvailabilityBlockFixtures } from './availability-blocks-fixtures.seed.js';
import { FIXTURE_MENTORS } from '../../users/constants/seed-fixture-users.constants.js';
import { FIXTURE_AVAILABILITY } from '../constants/seed-fixture-availability.constants.js';
import {
  FIXTURE_APPOINTMENTS,
  FIXTURE_APPOINTMENT_STATUSES,
} from '../constants/seed-fixture-appointments.constants.js';
import type { Prisma } from '../../../prisma/client.js';
import type { FixtureContext } from '../../../common/database/fixture-context.js';

export async function seedAppointmentsFixtures(
  tx: Prisma.TransactionClient,
  context: FixtureContext,
): Promise<number> {
  const data = buildAppointmentFixtures(context);
  await tx.appointment.createMany({ data, skipDuplicates: true });
  return data.length;
}

export function buildAppointmentFixtures(context: FixtureContext) {
  const blocksById = new Map(
    buildAvailabilityBlockFixtures(context).map((block) => [block.id, block]),
  );
  return FIXTURE_MENTORS.flatMap((mentor, mentorIndex) => {
    const plan = FIXTURE_APPOINTMENTS[mentorIndex];
    const blocks = FIXTURE_AVAILABILITY[mentorIndex];
    return FIXTURE_APPOINTMENT_STATUSES.map((status, index) => {
      const isHistorical = index < 4;
      const slot = isHistorical ? index : index - 4;
      const blockId = context.getId(
        blocks.blockKeys[isHistorical ? 24 + slot : slot],
      );
      const block = blocksById.get(blockId)!;
      const requestedMinute = isHistorical ? -44730 + index * 1440 : -90;
      const respondedMinute = isHistorical ? -43260 + index * 1440 : -60;
      return {
        id: context.getId(plan.appointmentKeys[index]),
        blockId,
        mentorId: context.getId(mentor.key),
        studentId: context.getId(plan.studentKey),
        startAt: block.startAt,
        endAt: block.endAt,
        statusId: context.getReference('appointment_statuses', status),
        orientationTypeId: context.getReference(
          'orientation_types',
          plan.orientation,
        ),
        message: plan.message,
        rejectionReason:
          status === 'RECHAZADA'
            ? 'Tema fuera del alcance de esta sesión ficticia.'
            : null,
        meetingUrl: ['COMPLETADA', 'CONFIRMADA'].includes(status)
          ? `https://meet.example.invalid/seed/${plan.mentorNumber}-${index}`
          : null,
        cancelledById:
          status === 'CANCELADA' ? context.getId(plan.studentKey) : null,
        requestedAt: context.getDate('anchor', requestedMinute, false),
        respondedAt:
          status === 'PENDIENTE'
            ? null
            : context.getDate('anchor', respondedMinute, false),
        createdAt: context.getDate('anchor', requestedMinute, false),
        updatedAt: context.anchor,
      };
    });
  });
}
