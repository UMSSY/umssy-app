import { Injectable } from '@nestjs/common';
import { AvailabilityService } from '../../availability/services/availability.service.js';
import { MentorsService } from '../../mentors/services/mentors.service.js';
import { AppointmentMapper } from '../mappers/appointment.mapper.js';
import { AppointmentsRepository } from '../repositories/appointments.repository.js';

@Injectable()
export class AppointmentsService {
  constructor(
    private readonly appointmentsRepository: AppointmentsRepository,
    private readonly appointmentMapper: AppointmentMapper,
    private readonly availabilityService: AvailabilityService,
    private readonly mentorsService: MentorsService,
  ) {}
}
