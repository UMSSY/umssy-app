import { Injectable } from '@nestjs/common';
import { AppointmentDocumentMapper } from './appointment-document.mapper.js';
import type { AppointmentDetailResponse } from '../types/appointment-detail-response.types.js';
import type { AppointmentRecord } from '../types/appointment-record.types.js';
import type { MyAppointmentResponse } from '../types/my-appointment-response.types.js';
import { AppointmentStatusTitle } from '../../availability/enums/appointment-status-title.enum.js';
import { buildAppointmentCancellation } from '../utils/appointment-cancellation.js';
import { resolveAppointmentStatus } from '../utils/appointment-status.js';

@Injectable()
export class AppointmentMapper {
  constructor(private readonly documentMapper: AppointmentDocumentMapper) {}

  toResponse(
    appointment: AppointmentRecord,
    userId: string,
    now: Date,
  ): MyAppointmentResponse {
    const status = resolveAppointmentStatus(
      appointment.status.title,
      appointment.endAt,
      now,
    );
    const counterpart =
      appointment.mentorId === userId
        ? appointment.student
        : appointment.mentor;

    return {
      id: appointment.id,
      blockId: appointment.blockId,
      startAt: appointment.startAt.toISOString(),
      endAt: appointment.endAt.toISOString(),
      orientationType: appointment.orientationType,
      counterpart: {
        id: counterpart.id,
        fullName: `${counterpart.firstName} ${counterpart.lastName}`.trim(),
        role: appointment.mentorId === userId ? 'student' : 'mentor',
      },
      status,
      message: appointment.message,
      requestedAt: appointment.requestedAt.toISOString(),
      document: appointment.document
        ? this.documentMapper.toResponse(appointment.document)
        : null,
      cancellation:
        status === AppointmentStatusTitle.CANCELLED
          ? buildAppointmentCancellation(appointment, userId)
          : null,
    };
  }

  toDetailResponse(
    appointment: AppointmentRecord,
    userId: string,
    meetingUrl: string | null,
    now: Date,
  ): AppointmentDetailResponse {
    return { ...this.toResponse(appointment, userId, now), meetingUrl };
  }

  toResponseList(
    appointments: AppointmentRecord[],
    userId: string,
    now: Date,
  ): MyAppointmentResponse[] {
    return appointments.map((appointment) =>
      this.toResponse(appointment, userId, now),
    );
  }
}
