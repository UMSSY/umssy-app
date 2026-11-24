import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import { DEFAULT_JOB_ALERT_MODE, JOB_ALERT_MODES } from '../constants/job-alert-preference.constants.js';
import type { JobAlertMode } from '../enums/job-alert-mode.enum.js';

@Injectable()
export class JobAlertPreferencesRepository {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
  ) {}

  async findMode(userId: string): Promise<string | null> {
    const row = await this.prisma.jobOfferNotificationPreference.findUnique({
      where: { userId },
      select: { mode: { select: { title: true } } },
    });
    return row?.mode.title ?? null;
  }

  async upsertMode(userId: string, mode: JobAlertMode): Promise<void> {
    await this.prisma.jobOfferNotificationPreference.upsert({
      where: { userId },
      update: { mode: { connect: { title: mode } } },
      create: {
        user: { connect: { id: userId } },
        mode: { connect: { title: mode } },
      },
    });
  }

  async findFilteredModes(): Promise<Map<string, string>> {
    const rows = await this.prisma.jobOfferNotificationPreference.findMany({
      where: {
        mode: {
          title: { in: JOB_ALERT_MODES.filter((mode) => mode !== DEFAULT_JOB_ALERT_MODE) },
        },
      },
      select: { userId: true, mode: { select: { title: true } } },
    });
    return new Map(rows.map(({ userId, mode }) => [userId, mode.title]));
  }
}
