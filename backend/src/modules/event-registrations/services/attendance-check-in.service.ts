import { Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../../../common/types/authenticated-user.types.js';
import { InternalException } from '../../../common/exceptions/internal.exception.js';
import { AttendancePassInvalidException } from '../exceptions/attendance-pass-invalid.exception.js';
import { AttendanceCheckInRepository } from '../repositories/attendance-check-in.repository.js';
import { AttendanceValidationService } from './attendance-validation.service.js';
import type { AttendanceCheckInResponse } from '../types/attendance-check-in-response.types.js';

@Injectable()
export class AttendanceCheckInService {
  constructor(
    private readonly repository: AttendanceCheckInRepository,
    private readonly validation: AttendanceValidationService,
  ) {}

  checkIn(eventId: string, actor: AuthenticatedUser, reference: string): Promise<AttendanceCheckInResponse> {
    return this.repository.transaction(async (tx) => {
      const initial = await this.validation.resolveForCheckIn(eventId, actor, reference, tx);
      if (!await this.repository.lockRegistration(tx, eventId, initial.registrationId)) {
        throw new AttendancePassInvalidException();
      }

      // Cancellation or QR rotation may have happened while waiting for the row lock.
      const checkedInAt = new Date();
      const current = await this.validation.resolveForCheckIn(eventId, actor, reference, tx, checkedInAt);
      if (current.registrationId !== initial.registrationId) throw new AttendancePassInvalidException();

      const { count } = await this.repository.insertIfAbsent(tx, current.registrationId, actor.id, checkedInAt);
      const attendance = await this.repository.findAttendance(tx, current.registrationId);
      if (!attendance) throw new InternalException();

      return {
        result: count === 1 ? 'registered' : 'duplicate',
        checkedInAt: attendance.checkedInAt.toISOString(),
      };
    });
  }
}
