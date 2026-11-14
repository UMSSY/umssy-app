import { Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../../../common/types/authenticated-user.types.js';
import { TransactionService } from '../../../common/prisma/transaction.service.js';
import { AppointmentStatusTitle } from '../../availability/enums/appointment-status-title.enum.js';
import { DayBlockedException } from '../../availability/exceptions/index.js';
import { AvailabilityService } from '../../availability/services/availability.service.js';
import { BlockedDatesService } from '../../availability/services/blocked-dates.service.js';
import { MentorsService } from '../../mentors/services/mentors.service.js';
import { ProfilePhotoService } from '../../profile/services/profile-photo.service.js';
import type { PhotoFileDownload } from '../../profile/types/photo-file-download.type.js';
import { ACTIVE_APPOINTMENT_STATUS_TITLES } from '../constants/active-appointment-statuses.constants.js';
import { CANCELLATION_REASON_WINDOW_MS } from '../constants/cancellation.constants.js';
import { CANCELLED_APPOINTMENT_STATUS_TITLES } from '../constants/cancelled-appointment-statuses.constants.js';
import {
  AppointmentNotCancellableException,
  AppointmentOverlapException,
  BlockAlreadyBookedException,
  BlockInPastException,
  CancelReasonRequiredException,
  DailyAppointmentLimitException,
  InvalidOrientationTypeException,
  MentorUnavailableException,
  OwnBlockException,
  SlotUnavailableException,
} from '../exceptions/index.js';
import { AppointmentNotFoundException } from '../exceptions/appointment-not-found.exception.js';
import { AppointmentNotOwnedException } from '../exceptions/appointment-not-owned.exception.js';
import { AppointmentMapper } from '../mappers/appointment.mapper.js';
import { AppointmentsRepository } from '../repositories/appointments.repository.js';
import type { CancelAppointmentDto } from '../requests/cancel-appointment.request.js';
import type { CreateAppointmentDto } from '../requests/create-appointment.request.js';
import type { AppointmentDetailResponse } from '../types/appointment-detail-response.types.js';
import type { AppointmentRecord } from '../types/appointment-record.types.js';
import type { MyAppointmentResponse } from '../types/my-appointment-response.types.js';
import type { MyAppointmentsPageResponse } from '../types/my-appointments-page-response.types.js';
import type { MyAppointmentsQuery } from '../types/my-appointments-query.types.js';
import { getBoliviaDayRange } from '../utils/bolivia-day.js';
import { buildMeetingUrl, canShareMeetingUrl } from '../utils/meeting-url.js';

@Injectable()
export class AppointmentsService {
  constructor(
    private readonly appointmentsRepository: AppointmentsRepository,
    private readonly appointmentMapper: AppointmentMapper,
    private readonly availabilityService: AvailabilityService,
    private readonly blockedDatesService: BlockedDatesService,
    private readonly mentorsService: MentorsService,
    private readonly profilePhotoService: ProfilePhotoService,
    private readonly transactions: TransactionService,
  ) {}

  async create(
    user: AuthenticatedUser,
    payload: CreateAppointmentDto,
  ): Promise<MyAppointmentResponse> {
    const block = await this.availabilityService.findBlockWithAppointments(
      payload.blockId,
    );

    if (!block) {
      throw new SlotUnavailableException();
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

    return this.blockedDatesService
      .runOnUnblockedDay(block.mentorId, block.startAt, async (tx) => {
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
          throw new SlotUnavailableException();
        }
        if (current.appointments.length > 0) {
          throw new BlockAlreadyBookedException();
        }

        await this.assertMentorAcceptsTopic(
          current.mentorId,
          payload.orientationTypeId,
        );

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

        const reservedThatDay =
          await this.appointmentsRepository.hasReservationOnDay(
            user.id,
            getBoliviaDayRange(current.startAt),
            tx,
          );

        if (reservedThatDay) {
          throw new DailyAppointmentLimitException();
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
            meetingUrl: buildMeetingUrl(),
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

        return this.appointmentMapper.toResponse(
          appointment,
          user.id,
          new Date(),
        );
      })
      .catch((error: unknown) => {
        if (error instanceof DayBlockedException) {
          throw new SlotUnavailableException();
        }
        throw error;
      });
  }

  async findMine(
    userId: string,
    query: MyAppointmentsQuery,
  ): Promise<MyAppointmentsPageResponse> {
    const now = new Date();
    const counterpartIds = query.q
      ? await this.appointmentsRepository.findCounterpartIdsByName(
          userId,
          this.normalizeSearchText(query.q),
        )
      : undefined;
    const total = await this.appointmentsRepository.countMine(
      userId,
      query.scope,
      now,
      counterpartIds,
    );
    const lastPage = Math.max(1, Math.ceil(total / query.pageSize));
    const page = Math.min(query.page, lastPage);
    const appointments = await this.appointmentsRepository.findMine(
      userId,
      query.scope,
      now,
      page,
      query.pageSize,
      counterpartIds,
    );

    return {
      items: this.appointmentMapper.toResponseList(appointments, userId, now),
      total,
      page,
      pageSize: query.pageSize,
    };
  }

  async findOne(
    userId: string,
    id: string,
  ): Promise<AppointmentDetailResponse> {
    const appointment = await this.findParticipatedAppointment(userId, id);
    const now = new Date();
    const meetingUrl = await this.resolveMeetingUrl(appointment, now);
    return this.appointmentMapper.toDetailResponse(
      appointment,
      userId,
      meetingUrl,
      now,
    );
  }

  async cancel(
    user: AuthenticatedUser,
    id: string,
    payload: CancelAppointmentDto,
  ): Promise<MyAppointmentResponse> {
    const appointment = await this.findParticipatedAppointment(user.id, id);
    const statusTitle = appointment.status.title as AppointmentStatusTitle;

    if (CANCELLED_APPOINTMENT_STATUS_TITLES.includes(statusTitle)) {
      return this.appointmentMapper.toResponse(appointment, user.id);
    }

    if (!ACTIVE_APPOINTMENT_STATUS_TITLES.includes(statusTitle)) {
      throw new AppointmentNotCancellableException();
    }

    const now = new Date();
    if (appointment.startAt.getTime() <= now.getTime()) {
      throw new AppointmentNotCancellableException();
    }

    const reason = payload.reason?.trim() || null;
    const timeLeft = appointment.startAt.getTime() - now.getTime();
    if (!reason && timeLeft < CANCELLATION_REASON_WINDOW_MS) {
      throw new CancelReasonRequiredException();
    }

    const counterpartId =
      appointment.mentorId === user.id
        ? appointment.studentId
        : appointment.mentorId;

    return this.transactions.run(async ({ client }) => {
      await this.appointmentsRepository.lockParticipants(
        [user.id, counterpartId],
        client,
      );

      const current = await this.appointmentsRepository.findById(
        appointment.id,
        client,
      );
      if (!current) {
        throw new AppointmentNotFoundException();
      }
      if (
        CANCELLED_APPOINTMENT_STATUS_TITLES.includes(
          current.status.title as AppointmentStatusTitle,
        )
      ) {
        return this.appointmentMapper.toResponse(current, user.id);
      }

      const previousStatusId =
        await this.appointmentsRepository.findStatusIdByTitle(
          current.status.title as AppointmentStatusTitle,
          client,
        );
      const newStatusId = await this.appointmentsRepository.findStatusIdByTitle(
        AppointmentStatusTitle.CANCELLED,
        client,
      );

      const cancelled = await this.appointmentsRepository.cancelAppointment(
        appointment.id,
        {
          statusId: newStatusId,
          cancelledById: user.id,
          cancelledAt: now,
          cancellationReason: reason,
        },
        client,
      );

      await this.appointmentsRepository.createAppointmentHistory(
        {
          appointmentId: appointment.id,
          previousStatusId,
          newStatusId,
          changedById: user.id,
        },
        client,
      );

      return this.appointmentMapper.toResponse(cancelled, user.id);
    });
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

  private async resolveMeetingUrl(
    appointment: AppointmentRecord,
    now: Date,
  ): Promise<string | null> {
    if (!canShareMeetingUrl(appointment.status.title, appointment.endAt, now)) {
      return null;
    }
    if (appointment.meetingUrl) {
      return appointment.meetingUrl;
    }
    return this.appointmentsRepository.assignMeetingUrl(
      appointment.id,
      buildMeetingUrl(),
    );
  }

  private async assertMentorAcceptsTopic(
    mentorId: string,
    orientationTypeId: string,
  ): Promise<void> {
    const mentor = await this.mentorsService.findOne(mentorId);

    if (!mentor.isAvailable) {
      throw new MentorUnavailableException();
    }

    const offersTopic = mentor.orientationTypes.some(
      (orientation) => orientation.id === orientationTypeId,
    );

    if (!offersTopic) {
      throw new InvalidOrientationTypeException();
    }
  }

  private normalizeSearchText(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ');
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
