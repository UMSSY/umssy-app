import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import { ACTIVE_APPOINTMENT_STATUSES } from '../../availability/constants/appointment-status.constants.js';
import type { UserRole } from '../../../prisma/client.js';
import type { MentorExitDecision } from '../types/mentor-exit-decision.types.js';
import type { MentorExitState } from '../types/mentor-exit-state.types.js';
import { withMentorCapacityLock } from './mentor-capacity-lock.js';
import { reconcileMentorOffers } from './mentor-offers.queries.js';

@Injectable()
export class MentorExitRepository {
  constructor(private readonly prisma: PrismaService) {}

  deactivate(userId: string, canDeactivate: MentorExitDecision): Promise<boolean> {
    return withMentorCapacityLock(this.prisma, async (tx) => {
      const roles = await tx.$queryRaw<Pick<UserRole, 'id'>[]>`
        SELECT ur.id FROM user_roles ur JOIN roles r ON r.id = ur.role_id
        WHERE ur.user_id = ${userId}::uuid AND r.name = 'mentor'
          AND ur.deleted_at IS NULL AND ur.start_at <= clock_timestamp()
        FOR UPDATE OF ur`;
      let hasFutureAppointments = false;
      if (roles.length) {
        await tx.$executeRaw`LOCK TABLE appointments IN SHARE MODE`;
        const [appointments] = await tx.$queryRaw<Pick<MentorExitState, 'hasFutureAppointments'>[]>`
        SELECT EXISTS (
          SELECT 1 FROM appointments a JOIN appointment_statuses s ON s.id = a.status_id
          WHERE a.mentor_id = ${userId}::uuid AND a.start_at > clock_timestamp()
            AND s.title IN (${ACTIVE_APPOINTMENT_STATUSES[0]}, ${ACTIVE_APPOINTMENT_STATUSES[1]})
        ) AS "hasFutureAppointments"`;
        hasFutureAppointments = appointments.hasFutureAppointments;
      }
      if (!canDeactivate({ hasActiveRole: roles.length > 0, hasFutureAppointments })) return false;

      await tx.$executeRaw`
        UPDATE user_roles ur SET deleted_at = clock_timestamp()
        FROM roles r WHERE r.id = ur.role_id AND r.name = 'mentor'
          AND ur.user_id = ${userId}::uuid AND ur.deleted_at IS NULL`;
      await tx.$executeRaw`
        UPDATE mentor_participation_requests SET status = 'ENDED'
        WHERE user_id = ${userId}::uuid AND status = 'ACTIVE'`;
      await tx.user.update({ where: { id: userId }, data: { isAvailableForMentoring: false } });
      await reconcileMentorOffers(tx);
      return true;
    });
  }
}
