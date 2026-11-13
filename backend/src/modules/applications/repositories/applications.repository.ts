import { RECRUITMENT_APPLICATION_SELECT } from '../constants/recruitment-application-select.constants.js';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import type { Prisma } from '../../../prisma/client.js';
import type { FindApplicationsQueryDto } from '../requests/find-applications.request.js';

@Injectable()
export class ApplicationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByUserId(userId: string, query: FindApplicationsQueryDto) {
    const where: Prisma.JobApplicationWhereInput = {
      userId,
      ...(query.status ? { status: { title: query.status } } : {}),
    };
    const direction = query.sortOrder;
    const orderBy: Prisma.JobApplicationOrderByWithRelationInput =
      query.sortBy === 'vacancy'
        ? { jobOffer: { title: direction } }
        : query.sortBy === 'company'
          ? { jobOffer: { company: { title: direction } } }
          : query.sortBy === 'status'
            ? { status: { title: direction } }
            : { appliedAt: direction };
    return this.prisma.jobApplication.findMany({
      where,
      orderBy: [orderBy, { id: direction }],
      select: {
        id: true,
        jobOfferId: true,
        appliedAt: true,
        status: { select: { title: true } },
        jobOffer: {
          select: { title: true, company: { select: { title: true } } },
        },
      },
    });
  }

  findById(id: string) {
    return this.prisma.jobApplication.findUnique({
      where: { id },
      select: { id: true, userId: true, status: { select: { title: true } } },
    });
  }

  withdraw(id: string, userId: string, statuses: string[], title: string) {
    return this.prisma.$transaction(async (tx) => {
      const status = await tx.jobApplicationStatus.findUniqueOrThrow({
        where: { title },
        select: { id: true },
      });
      return tx.jobApplication.updateMany({
        where: { id, userId, status: { title: { in: statuses } } },
        data: { statusId: status.id },
      });
    });
  }
  findRecruitmentApplicationsByUser(userId: string) {
    return this.prisma.jobApplication.findMany({
      where: { userId },
      orderBy: { appliedAt: 'desc' },
      select: RECRUITMENT_APPLICATION_SELECT,
    });
  }
  findRecruitmentApplicants(jobId: string) {
    return this.prisma.jobApplication.findMany({
      where: { jobOfferId: jobId, status: { title: { not: 'Retirada' } } },
      orderBy: { appliedAt: 'desc' },
      select: RECRUITMENT_APPLICATION_SELECT,
    });
  }
  findRecruitmentApplication(id: string) {
    return this.prisma.jobApplication.findUnique({
      where: { id },
      select: RECRUITMENT_APPLICATION_SELECT,
    });
  }
  recordRecruiterDecision(applicationId: string, target: string) {
    return this.prisma.$queryRaw<{ id: string }[]>`
      UPDATE job_applications a SET status_id=target_status.id,updated_at=now()
      FROM job_application_statuses target_status
      WHERE a.id=${applicationId}::uuid AND target_status.title=${target}
      AND a.status_id IN (SELECT id FROM job_application_statuses WHERE title IN ('En revisión','Entrevista'))
      RETURNING a.id`;
  }
}
