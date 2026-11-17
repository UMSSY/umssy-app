import { Injectable } from '@nestjs/common';
import { ForbiddenRoleException } from '../../../common/exceptions/forbidden-role.exception.js';
import { ValidationException } from '../../../common/exceptions/validation.exception.js';
import type { AuthenticatedUser } from '../../../common/types/authenticated-user.types.js';
import type { Prisma } from '../../../prisma/client.js';
import { REGISTRATION_STATUS_TITLES } from '../../../common/constants/registration-status.constants.js';
import { AttendanceAccessDeniedException } from '../exceptions/attendance-access-denied.exception.js';
import { AttendancePassCancelledException } from '../exceptions/attendance-pass-cancelled.exception.js';
import { AttendancePassInvalidException } from '../exceptions/attendance-pass-invalid.exception.js';
import { assertAttendanceWindow } from '../utils/assert-attendance-window.js';
import { AttendanceValidationRepository } from '../repositories/attendance-validation.repository.js';
import { EventsService } from '../../events/services/events.service.js';
import {
  AttendanceCheckInBodySchema,
  AttendanceCheckInParamsSchema,
} from '../requests/attendance-check-in.request.js';

@Injectable()
export class AttendanceValidationService {
  constructor(private readonly repository: AttendanceValidationRepository, private readonly eventsService: EventsService) {}

  async resolveForCheckIn(
    eventId: string,
    actor: AuthenticatedUser,
    reference: string,
    tx?: Prisma.TransactionClient,
    now: Date = new Date(),
  ): Promise<{ registrationId: string }> {
    if (!actor.roles.includes('titulado')) throw new ForbiddenRoleException();
    if (!AttendanceCheckInParamsSchema.safeParse({ eventId }).success) throw new ValidationException();

    const workshop = await this.eventsService.findManagedWorkshop(eventId, actor.id, tx);
    if (!workshop) throw new AttendanceAccessDeniedException();

    const parsed = AttendanceCheckInBodySchema.safeParse({ reference });
    if (!parsed.success) throw new ValidationException();

    const pass = await this.repository.findPassInWorkshop(eventId, parsed.data.reference, tx);
    if (!pass) throw new AttendancePassInvalidException();
    if (pass.cancelledAt || pass.status.title === REGISTRATION_STATUS_TITLES.cancelled) {
      throw new AttendancePassCancelledException();
    }
    if (pass.status.title !== REGISTRATION_STATUS_TITLES.confirmed) {
      throw new AttendancePassInvalidException();
    }

    assertAttendanceWindow(workshop, now);
    return { registrationId: pass.id };
  }
}
