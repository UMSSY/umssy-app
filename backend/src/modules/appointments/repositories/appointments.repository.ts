import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import type { TransactionClient } from '../../../common/types/transaction-client.types.js';
import { AppointmentStatusTitle } from '../../availability/enums/appointment-status-title.enum.js';
import { APPOINTMENT_SELECT } from '../constants/appointment-select.constants.js';
import type { AppointmentRecord } from '../types/appointment-record.types.js';
import type { CreateAppointmentData } from '../types/create-appointment-data.types.js';

@Injectable()
export class AppointmentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findStatusIdByTitle(
    title: AppointmentStatusTitle,
    client: TransactionClient = this.prisma,
  ): Promise<string> {
    const status = await client.appointmentStatus.findUniqueOrThrow({
      where: { title },
      select: { id: true },
    });

    return status.id;
  }

  createAppointment(
    data: CreateAppointmentData,
    client: TransactionClient = this.prisma,
  ): Promise<AppointmentRecord> {
    return client.appointment.create({ data, select: APPOINTMENT_SELECT });
  }
}
