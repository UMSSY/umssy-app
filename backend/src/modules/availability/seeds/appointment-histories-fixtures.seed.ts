import { buildAppointmentFixtures } from './appointments-fixtures.seed.js';
import {
  FIXTURE_APPOINTMENTS,
  FIXTURE_APPOINTMENT_STATUSES,
} from '../constants/seed-fixture-appointments.constants.js';
import type { Prisma } from '../../../prisma/client.js';
import type { FixtureContext } from '../../../common/database/fixture-context.js';

export async function seedAppointmentHistoriesFixtures(
  tx: Prisma.TransactionClient,
  context: FixtureContext,
): Promise<number> {
  const data: Prisma.AppointmentHistoryCreateManyInput[] =
    buildAppointmentFixtures(context).flatMap(
      (appointment, appointmentIndex) => {
        const scenarioIndex =
          appointmentIndex % FIXTURE_APPOINTMENT_STATUSES.length;
        const plan =
          FIXTURE_APPOINTMENTS[
            Math.floor(appointmentIndex / FIXTURE_APPOINTMENT_STATUSES.length)
          ];
        const status = FIXTURE_APPOINTMENT_STATUSES[scenarioIndex];
        const transitions = [
          {
            status: 'PENDIENTE',
            previous: null as string | null,
            changedById: appointment.studentId,
            date: appointment.requestedAt,
            note: 'Solicitud de mentoría ficticia creada.',
          },
        ];
        if (status !== 'PENDIENTE') {
          transitions.push({
            status: status === 'COMPLETADA' ? 'CONFIRMADA' : status,
            previous: 'PENDIENTE',
            changedById:
              status === 'CANCELADA'
                ? appointment.studentId
                : appointment.mentorId,
            date: appointment.respondedAt!,
            note:
              status === 'COMPLETADA'
                ? 'Sesión ficticia confirmada.'
                : 'Estado actualizado para un escenario ficticio.',
          });
        }
        if (status === 'COMPLETADA') {
          transitions.push({
            status: 'COMPLETADA',
            previous: 'CONFIRMADA',
            changedById: appointment.mentorId,
            date: appointment.endAt,
            note: 'Estado actualizado para un escenario ficticio.',
          });
        }
        return transitions.map((transition, index) => ({
          id: context.getId(plan.historyKeys[scenarioIndex][index]),
          appointmentId: appointment.id,
          previousStatusId: transition.previous
            ? context.getReference('appointment_statuses', transition.previous)
            : null,
          newStatusId: context.getReference(
            'appointment_statuses',
            transition.status,
          ),
          changedById: transition.changedById,
          changedAt: transition.date,
          note: transition.note,
          createdAt: transition.date,
          updatedAt: context.anchor,
        }));
      },
    );
  await tx.appointmentHistory.createMany({ data, skipDuplicates: true });
  return data.length;
}
