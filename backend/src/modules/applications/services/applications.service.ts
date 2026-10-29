import { Injectable } from '@nestjs/common';
import { ApplicationsRepository } from '../repositories/applications.repository.js';
import { FindApplicationsQueryDto } from '../requests/find-applications.request.js';
import { ApplicationStatus, ApplicationItemResponse } from '../types/applications.types.js';
import { ApplicationNotFoundException } from '../exceptions/application-not-found.exception.js';
import { ApplicationForbiddenException } from '../exceptions/application-forbidden.exception.js';
import { ApplicationNotWithdrawableException } from '../exceptions/application-not-withdrawable.exception.js';

@Injectable()
export class ApplicationsService {
  constructor(private readonly repository: ApplicationsRepository) {}


async findMyApplications(userId: string, query: FindApplicationsQueryDto): Promise<ApplicationItemResponse[]> {
  const applications = await this.repository.findByUserId(userId, query);

  return applications.map((app) => {

    const statusTitle = (typeof app.status === 'object' ? app.status?.title : app.status) as ApplicationStatus;

    return {
      id: app.id,
      vacancy: app.jobOffer?.title || 'Sin título',
      company: app.jobOffer?.company?.title || 'Empresa no especificada',
      affinity: 0,
      status: statusTitle,
      canWithdraw: [ApplicationStatus.IN_REVIEW, ApplicationStatus.INTERVIEW].includes(statusTitle),
      createdAt: app.createdAt,
    };
  });
}

async withdrawApplication(id: string, userId: string) {
  const application = await this.repository.findById(id);

  if (!application) {
    throw new ApplicationNotFoundException();
  }

  if (application.userId !== userId) {
    throw new ApplicationForbiddenException();
  }

  const currentStatus = (typeof application.status === 'object' ? application.status?.title : application.status) as ApplicationStatus;
  const withdrawableStatuses = [ApplicationStatus.IN_REVIEW, ApplicationStatus.INTERVIEW];

  if (!withdrawableStatuses.includes(currentStatus)) {
    throw new ApplicationNotWithdrawableException();
  }

  return this.repository.updateStatus(id, ApplicationStatus.WITHDRAWN);
}
}