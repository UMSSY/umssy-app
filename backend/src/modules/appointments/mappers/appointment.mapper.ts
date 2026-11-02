import { Injectable } from '@nestjs/common';
import { AppointmentStatusTitle } from '../../availability/enums/appointment-status-title.enum.js';
import type { AppointmentRecord } from '../types/appointment-record.types.js';
import type { MyAppointmentResponse } from '../types/my-appointment-response.types.js';

@Injectable()
export class AppointmentMapper {
  toResponse(
    appointment: AppointmentRecord,
    userId: string,
  ): MyAppointmentResponse {
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
      },
      status:
        appointment.status.title === AppointmentStatusTitle.LEGACY_CONFIRMED
          ? AppointmentStatusTitle.CONFIRMED
          : appointment.status.title,
    };
  }

  toResponseList(
    appointments: AppointmentRecord[],
    userId: string,
  ): MyAppointmentResponse[] {
    return appointments.map((appointment) =>
      this.toResponse(appointment, userId),
    );
  }
}
