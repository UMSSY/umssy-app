import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import { ACTIVE_APPOINTMENT_STATUSES } from '../../availability/constants/appointment-status.constants.js';
import { MentorTransactionRepository } from './mentor-transaction.repository.js';
import type { MentorTransaction } from '../types/mentor-transaction.types.js';

@Injectable()
export class MentorExitRepository extends MentorTransactionRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  activeRoles(tx: MentorTransaction, userId: string) {
    return tx.$queryRaw<{ id: string }[]>`
      SELECT ur.id FROM user_roles ur JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = ${userId}::uuid AND r.name = 'mentor'
        AND ur.deleted_at IS NULL AND ur.start_at <= clock_timestamp() FOR UPDATE OF ur`;
  }

  async lockAndReadAppointments(tx: MentorTransaction, userId: string) {
    // Impide reservas concurrentes entre la comprobación y la revocación del rol.
    await tx.$executeRaw`LOCK TABLE appointments IN SHARE MODE`;
    const [appointments] = await tx.$queryRaw<{ blocked: boolean }[]>`
      SELECT EXISTS (SELECT 1 FROM appointments a JOIN appointment_statuses s ON s.id = a.status_id
        WHERE a.mentor_id = ${userId}::uuid AND a.start_at > clock_timestamp()
          AND s.title IN (${ACTIVE_APPOINTMENT_STATUSES[0]}, ${ACTIVE_APPOINTMENT_STATUSES[1]})) AS blocked`;
    return appointments.blocked;
  }

  async endParticipation(tx: MentorTransaction, userId: string) {
    await tx.$executeRaw`
      UPDATE user_roles ur SET deleted_at = clock_timestamp() FROM roles r
      WHERE r.id = ur.role_id AND r.name = 'mentor' AND ur.user_id = ${userId}::uuid AND ur.deleted_at IS NULL`;
    await tx.$executeRaw`UPDATE mentor_participation_requests SET status_id = mentor_request_status('ENDED')
      WHERE user_id = ${userId}::uuid AND status_id = mentor_request_status('ACTIVE')`;
    await tx.user.update({
      where: { id: userId },
      data: { isAvailableForMentoring: false },
    });
  }
}
