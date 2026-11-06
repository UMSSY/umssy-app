import { Injectable } from '@nestjs/common';
import { MentorExitAppointmentsException } from '../exceptions/mentor-exit.exception.js';
import { MentorExitRepository } from '../repositories/mentor-exit.repository.js';
import type { MentorExitResponse } from '../responses/mentor-exit.response.js';
import type { MentorExitState } from '../types/mentor-exit-state.types.js';

@Injectable()
export class MentorExitService {
  constructor(private readonly repository: MentorExitRepository) {}

  async leave(userId: string): Promise<MentorExitResponse> {
    const hasEnded = await this.repository.deactivate(userId, (state) => this.canDeactivate(state));
    return { id: userId, status: 'ENDED', alreadyEnded: !hasEnded };
  }

  private canDeactivate(state: MentorExitState): boolean {
    if (!state.hasActiveRole) return false;
    if (state.hasFutureAppointments) throw new MentorExitAppointmentsException();
    return true;
  }
}
