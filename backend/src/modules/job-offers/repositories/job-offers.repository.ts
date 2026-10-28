import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import {
  JOB_OFFER_CREATED_SELECT,
  JOB_OFFER_SELECT,
} from '../constants/job-offer.constants.js';
import type { ListCompanyJobOffersRequest } from '../requests/list-company-job-offers.request.js';
import type { CreateJobOfferData } from '../types/create-job-offer-data.type.js';
import type { JobOfferCatalogIds } from '../types/job-offer-catalog-ids.type.js';
import type { UpdateJobOfferData } from '../types/update-job-offer-data.type.js';
import { JobOfferStatus } from '../types/job-offer.enum.js';
import type {
  JobOfferCreatedRecord,
  JobOfferRecord,
} from '../types/job-offer-record.type.js';
import { buildCompanyJobOffersQuery } from '../utils/build-company-job-offers-query.js';

@Injectable()
export class JobOffersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async companyExists(companyId: string): Promise<boolean> {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { id: true },
    });
    return company !== null;
  }

  async findCatalogIds(
    modality: string,
    contractType: string,
    status: string,
  ): Promise<JobOfferCatalogIds> {
    const [modalityRow, contractTypeRow, statusRow] = await Promise.all([
      modality ? this.prisma.jobOfferModality.findUnique({ where: { title: modality }, select: { id: true } }) : Promise.resolve(null),
      contractType ? this.prisma.jobOfferContractType.findUnique({
        where: { title: contractType },
        select: { id: true },
      }) : Promise.resolve(null),
      status ? this.prisma.jobOfferStatus.findUnique({ where: { title: status }, select: { id: true } }) : Promise.resolve(null),
    ]);

    return {
      modalityId: modalityRow?.id ?? null,
      contractTypeId: contractTypeRow?.id ?? null,
      statusId: statusRow?.id ?? null,
    };
  }

  async findStatusId(status: JobOfferStatus): Promise<string | null> {
    const row = await this.prisma.jobOfferStatus.findUnique({
      where: { title: status },
      select: { id: true },
    });
    return row?.id ?? null;
  }

  create(data: CreateJobOfferData): Promise<JobOfferCreatedRecord> {
    const { skillIds, ...jobOffer } = data;
    return this.prisma.jobOffer.create({
      data: {
        ...jobOffer,
        skills: { create: skillIds.map((skillId) => ({ skillId })) },
      },
      select: JOB_OFFER_CREATED_SELECT,
    });
  }

  findPublished(now: Date): Promise<JobOfferRecord[]> {
    return this.prisma.jobOffer.findMany({
      where: {
        status: { title: JobOfferStatus.PUBLISHED },
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      orderBy: { createdAt: 'desc' },
      select: JOB_OFFER_SELECT,
    });
  }

  findByCompany(
    companyId: string,
    filters: ListCompanyJobOffersRequest,
  ): Promise<JobOfferRecord[]> {
    const { where, orderBy } = buildCompanyJobOffersQuery(companyId, filters);
    return this.prisma.jobOffer.findMany({ where, orderBy, select: JOB_OFFER_SELECT });
  }

  findByCompanyAndId(companyId: string, jobOfferId: string): Promise<JobOfferRecord | null> {
    return this.prisma.jobOffer.findFirst({
      where: {
        id: jobOfferId,
        companyId,
        status: { title: { not: JobOfferStatus.DELETED } },
      },
      select: JOB_OFFER_SELECT,
    });
  }

  findHistoryByCompanyAndId(
    companyId: string,
    jobOfferId: string,
  ): Promise<JobOfferRecord | null> {
    return this.prisma.jobOffer.findFirst({
      where: {
        id: jobOfferId,
        companyId,
      },
      select: JOB_OFFER_SELECT,
    });
  }

  update(jobOfferId: string, data: UpdateJobOfferData): Promise<JobOfferRecord> {
    const { skillIds, ...jobOffer } = data;
    return this.prisma.jobOffer.update({
      where: { id: jobOfferId },
      data: {
        ...jobOffer,
        ...(skillIds && {
          skills: { deleteMany: {}, create: skillIds.map((skillId) => ({ skillId })) },
        }),
      },
      select: JOB_OFFER_SELECT,
    });
  }

  // La fecha de publicación que se muestra es createdAt, por eso al reabrir se renueva.
  reopen(jobOfferId: string, statusId: string, publishedAt: Date): Promise<JobOfferRecord> {
    return this.prisma.jobOffer.update({
      where: { id: jobOfferId },
      data: { statusId, createdAt: publishedAt },
      select: JOB_OFFER_SELECT,
    });
  }

  updateStatus(jobOfferId: string, statusId: string): Promise<JobOfferRecord> {
    return this.prisma.jobOffer.update({
      where: { id: jobOfferId },
      data: { statusId },
      select: JOB_OFFER_SELECT,
    });
  }
}