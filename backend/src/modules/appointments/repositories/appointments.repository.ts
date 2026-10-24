import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import type { TransactionClient } from '../../../common/types/transaction-client.types.js';
import { AppointmentStatusTitle } from '../../availability/enums/appointment-status-title.enum.js';

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
}
