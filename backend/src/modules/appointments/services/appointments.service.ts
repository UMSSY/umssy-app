import { Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../../../common/types/authenticated-user.types.js';
import { AppointmentStatusTitle } from '../../availability/enums/appointment-status-title.enum.js';
import { BlockNotFoundException } from '../../availability/exceptions/index.js';
import { AvailabilityRepository } from '../../availability/repositories/availability.repository.js';
import { BlockedDatesService } from '../../availability/services/blocked-dates.service.js';
import { MentorsService } from '../../mentors/services/mentors.service.js';
import {
  BlockAlreadyBookedException,
  BlockInPastException,
  MentorUnavailableException,
  OwnBlockException,
} from '../exceptions/index.js';
import { AppointmentMapper } from '../mappers/appointment.mapper.js';
import { AppointmentsRepository } from '../repositories/appointments.repository.js';
import type { CreateAppointmentDto } from '../requests/create-appointment.request.js';
import type { MyAppointmentResponse } from '../types/my-appointment-response.types.js';

@Injectable()
export class AppointmentsService {
  constructor(
    private readonly appointmentsRepository: AppointmentsRepository,
    private readonly appointmentMapper: AppointmentMapper,
    private readonly availabilityRepository: AvailabilityRepository,
    private readonly blockedDatesService: BlockedDatesService,
    private readonly mentorsService: MentorsService,
  ) {}

  async create(
    user: AuthenticatedUser,
    payload: CreateAppointmentDto,
  ): Promise<MyAppointmentResponse> {
    const block = await this.availabilityRepository.findById(payload.blockId);

    if (!block) {
      throw new BlockNotFoundException();
    }
    if (block.startAt.getTime() <= Date.now()) {
      throw new BlockInPastException();
    }
    if (block.mentorId === user.id) {
      throw new OwnBlockException();
    }
    if (block.appointments.length > 0) {
      throw new BlockAlreadyBookedException();
    }

    const mentor = await this.mentorsService.findOne(block.mentorId);

    if (!mentor.isAvailable) {
      throw new MentorUnavailableException();
    }

    return this.blockedDatesService.runOnUnblockedDay(
      block.mentorId,
      block.startAt,
      async (tx) => {
        const current = await this.availabilityRepository.findById(
          payload.blockId,
          tx,
        );

        if (!current) {
          throw new BlockNotFoundException();
        }
        if (current.appointments.length > 0) {
          throw new BlockAlreadyBookedException();
        }

        const statusId = await this.appointmentsRepository.findStatusIdByTitle(
          AppointmentStatusTitle.CONFIRMED,
          tx,
        );

        const appointment =
          await this.appointmentsRepository.createAppointment(
            {
              blockId: current.id,
              mentorId: current.mentorId,
              studentId: user.id,
              startAt: current.startAt,
              endAt: current.endAt,
              statusId,
              orientationTypeId: payload.orientationTypeId,
              message: payload.message,
            },
            tx,
          );

        return this.appointmentMapper.toResponse(appointment, user.id);
      },
    );
  }
}
