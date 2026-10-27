import { MentorRequestStatusCode } from '../types/mentor-request-status.enum.js';
import { Injectable } from '@nestjs/common';
import { MentorExitRepository } from '../repositories/mentor-exit.repository.js';
import { MentorExitAppointmentsException } from '../exceptions/mentor-exit.exception.js';
import { reconcileMentorOffers } from './mentor-offer-allocation.service.js';

@Injectable()
export class MentorExitService {
  constructor(private readonly repository: MentorExitRepository) {}

  leave(userId: string) {
    return this.repository.withLock(async (tx) => {
      const roles = await this.repository.activeRoles(tx, userId);
      if (!roles.length)
        return {
          id: userId,
          status: MentorRequestStatusCode.ENDED as const,
          alreadyEnded: true,
        };
      if (await this.repository.lockAndReadAppointments(tx, userId))
        throw new MentorExitAppointmentsException();
      // Las preferencias permanecen; el rol, el cupo y la prioridad anterior se pierden.
      await this.repository.endParticipation(tx, userId);
      await reconcileMentorOffers(this.repository, tx);
      return {
        id: userId,
        status: MentorRequestStatusCode.ENDED as const,
        alreadyEnded: false,
      };
    });
  }
}
