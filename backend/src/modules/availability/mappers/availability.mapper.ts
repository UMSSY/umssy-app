import { Injectable } from '@nestjs/common';
import { ACTIVE_APPOINTMENT_STATUSES } from '../constants/appointment-status.constants.js';
import type { AvailabilityBlockResponse } from '../types/availability-block-response.types.js';
import type { AvailabilityBlockState } from '../types/availability-block-state.types.js';
import type { AvailabilityBlockWithAppointmentDetail } from '../types/availability-block-with-appointment-detail.types.js';
import type { AvailabilityBlockWithAppointments } from '../types/availability-block-with-appointments.types.js';
import type { BlockAppointmentResponse } from '../types/block-appointment-response.types.js';
import type { DeletedBlockResponse } from '../types/deleted-block-response.types.js';
import type { MentorAvailabilityStatusResponse } from '../types/mentor-availability-status-response.types.js';
import type { OwnerAvailabilityBlockResponse } from '../types/owner-availability-block-response.types.js';

@Injectable()
export class AvailabilityMapper {
  toResponse(block: AvailabilityBlockWithAppointments): AvailabilityBlockResponse {
    return {
      id: block.id,
      mentorId: block.mentorId,
      startAt: block.startAt.toISOString(),
      endAt: block.endAt.toISOString(),
      state: this.toState(block),
      createdAt: block.createdAt.toISOString(),
      updatedAt: block.updatedAt.toISOString(),
    };
  }

  toResponseList(blocks: AvailabilityBlockWithAppointments[]): AvailabilityBlockResponse[] {
    return blocks.map((block) => this.toResponse(block));
  }

  toOwnerResponse(block: AvailabilityBlockWithAppointmentDetail): OwnerAvailabilityBlockResponse {
    const [appointment] = block.appointments;
    return {
      ...this.toResponse(block),
      appointment: appointment ? this.toBlockAppointmentResponse(appointment) : null,
    };
  }

  toOwnerResponseList(blocks: AvailabilityBlockWithAppointmentDetail[]): OwnerAvailabilityBlockResponse[] {
    return blocks.map((block) => this.toOwnerResponse(block));
  }

  toDeletedResponse(block: AvailabilityBlockWithAppointments): DeletedBlockResponse {
    return { id: block.id };
  }

  toAvailabilityStatusResponse(mentorId: string, isAvailable: boolean): MentorAvailabilityStatusResponse {
    return { mentorId, isAvailable };
  }

  private toBlockAppointmentResponse(
    appointment: AvailabilityBlockWithAppointmentDetail['appointments'][number],
  ): BlockAppointmentResponse {
    const { student } = appointment;
    return {
      id: appointment.id,
      counterpart: { id: student.id, fullName: `${student.firstName} ${student.lastName}`.trim(), role: 'student' },
      orientationType: appointment.orientationType,
    };
  }

  private toState(block: AvailabilityBlockWithAppointments): AvailabilityBlockState {
    const hasActiveAppointment = block.appointments.some((appointment) =>
      ACTIVE_APPOINTMENT_STATUSES.some((status) => status === appointment.status.title),
    );
    return hasActiveAppointment ? 'confirmed' : 'free';
  }
}
