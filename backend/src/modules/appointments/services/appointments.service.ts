import { Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../../../common/types/authenticated-user.types.js';
import { AppointmentStatusTitle } from '../../availability/enums/appointment-status-title.enum.js';
import { BlockNotFoundException } from '../../availability/exceptions/index.js';
import { AvailabilityService } from '../../availability/services/availability.service.js';
import { BlockedDatesService } from '../../availability/services/blocked-dates.service.js';
import { MentorsService } from '../../mentors/services/mentors.service.js';
import { ProfilePhotoService } from '../../profile/services/profile-photo.service.js';
import type { PhotoFileDownload } from '../../profile/types/photo-file-download.type.js';
import {
  AppointmentOverlapException,
  BlockAlreadyBookedException,
  BlockInPastException,
  InvalidOrientationTypeException,
  MentorUnavailableException,
  OwnBlockException,
} from '../exceptions/index.js';
import { AppointmentNotFoundException } from '../exceptions/appointment-not-found.exception.js';
import { AppointmentNotOwnedException } from '../exceptions/appointment-not-owned.exception.js';
import { AppointmentMapper } from '../mappers/appointment.mapper.js';
import { AppointmentsRepository } from '../repositories/appointments.repository.js';
import type { CreateAppointmentDto } from '../requests/create-appointment.request.js';
import type { AppointmentRecord } from '../types/appointment-record.types.js';
import type { MyAppointmentResponse } from '../types/my-appointment-response.types.js';
import type { MyAppointmentsPageResponse } from '../types/my-appointments-page-response.types.js';
import type { MyAppointmentsQuery } from '../types/my-appointments-query.types.js';

@Injectable()
export class AppointmentsService {
  constructor(
    private readonly appointmentsRepository: AppointmentsRepository,
    private readonly appointmentMapper: AppointmentMapper,
    private readonly availabilityService: AvailabilityService,
    private readonly blockedDatesService: BlockedDatesService,
    private readonly mentorsService: MentorsService,
    private readonly profilePhotoService: ProfilePhotoService,
  ) {}

  async create(
    user: AuthenticatedUser,
    payload: CreateAppointmentDto,
  ): Promise<MyAppointmentResponse> {
    const block = await this.availabilityService.findBlockWithAppointments(
      payload.blockId,
    );

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

    const offersTopic = mentor.orientationTypes.some(
      (orientation) => orientation.id === payload.orientationTypeId,
    );

    if (!offersTopic) {
      throw new InvalidOrientationTypeException();
    }

    return this.blockedDatesService.runOnUnblockedDay(
      block.mentorId,
      block.startAt,
      async (tx) => {
        await this.appointmentsRepository.lockParticipants(
          [user.id, block.mentorId],
          tx,
        );

        const current =
          await this.availabilityService.findBlockWithAppointments(
            payload.blockId,
            tx,
          );

        if (!current) {
          throw new BlockNotFoundException();
        }
        if (current.appointments.length > 0) {
          throw new BlockAlreadyBookedException();
        }

        const overlaps =
          await this.appointmentsRepository.hasOverlappingAppointment(
            user.id,
            current.startAt,
            current.endAt,
            tx,
          );

        if (overlaps) {
          throw new AppointmentOverlapException();
        }

        const statusId = await this.appointmentsRepository.findStatusIdByTitle(
          AppointmentStatusTitle.CONFIRMED,
          tx,
        );

        const appointment = await this.appointmentsRepository.createAppointment(
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

        await this.appointmentsRepository.createAppointmentHistory(
          {
            appointmentId: appointment.id,
            previousStatusId: null,
            newStatusId: statusId,
            changedById: user.id,
          },
          tx,
        );

        return this.appointmentMapper.toResponse(appointment, user.id);
      },
    );
  }

  async findMine(
    userId: string,
    query: MyAppointmentsQuery,
  ): Promise<MyAppointmentsPageResponse> {
    const now = new Date();
    const total = await this.appointmentsRepository.countMine(
      userId,
      query.scope,
      now,
    );
    const lastPage = Math.max(1, Math.ceil(total / query.pageSize));
    const page = Math.min(query.page, lastPage);
    const appointments = await this.appointmentsRepository.findMine(
      userId,
      query.scope,
      now,
      page,
      query.pageSize,
    );

    return {
      items: this.appointmentMapper.toResponseList(appointments, userId),
      total,
      page,
      pageSize: query.pageSize,
    };
  }

  async findOne(userId: string, id: string): Promise<MyAppointmentResponse> {
    const appointment = await this.findParticipatedAppointment(userId, id);
    return this.appointmentMapper.toResponse(appointment, userId);
  }

  async getCounterpartPhoto(
    userId: string,
    id: string,
  ): Promise<PhotoFileDownload> {
    const appointment = await this.findParticipatedAppointment(userId, id);
    const counterpartId =
      appointment.mentorId === userId
        ? appointment.studentId
        : appointment.mentorId;
    return this.profilePhotoService.getPhoto(counterpartId);
  }

  private async findParticipatedAppointment(
    userId: string,
    id: string,
  ): Promise<AppointmentRecord> {
    const appointment = await this.appointmentsRepository.findById(id);
    if (!appointment) {
      throw new AppointmentNotFoundException();
    }
    if (appointment.mentorId !== userId && appointment.studentId !== userId) {
      throw new AppointmentNotOwnedException();
    }
    return appointment;
  }
}
