import { Injectable } from '@nestjs/common';
import { AvailabilityService } from '../../availability/services/availability.service.js';
import { MentorsService } from '../../mentors/services/mentors.service.js';
import { AppointmentNotFoundException } from '../exceptions/appointment-not-found.exception.js';
import { AppointmentNotOwnedException } from '../exceptions/appointment-not-owned.exception.js';
import { AppointmentMapper } from '../mappers/appointment.mapper.js';
import { AppointmentsRepository } from '../repositories/appointments.repository.js';
import type { MyAppointmentResponse } from '../types/my-appointment-response.types.js';
import type { MyAppointmentsQuery } from '../types/my-appointments-query.types.js';

@Injectable()
export class AppointmentsService {
  constructor(
    private readonly appointmentsRepository: AppointmentsRepository,
    private readonly appointmentMapper: AppointmentMapper,
    private readonly availabilityService: AvailabilityService,
    private readonly mentorsService: MentorsService,
  ) {}

  async findMine(
    userId: string,
    query: MyAppointmentsQuery,
  ): Promise<MyAppointmentResponse[]> {
    const now = new Date();
    const appointments = await this.appointmentsRepository.findMine(
      userId,
      query.scope,
      now,
    );
    return this.appointmentMapper.toResponseList(appointments, userId);
  }

  async findOne(userId: string, id: string): Promise<MyAppointmentResponse> {
    const appointment = await this.appointmentsRepository.findById(id);
    if (!appointment) {
      throw new AppointmentNotFoundException();
    }
    if (appointment.mentorId !== userId && appointment.studentId !== userId) {
      throw new AppointmentNotOwnedException();
    }
    return this.appointmentMapper.toResponse(appointment, userId);
  }
}
