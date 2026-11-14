import { JobOfferMatchRepository } from '../repositories/job-offer-match.repository.js';
import { Injectable } from '@nestjs/common';
import {
  CompanyNotFoundException,
  JobOfferCatalogNotFoundException,
  JobOfferExpiryInPastException,
  JobOfferNotFoundException,
  JobOfferNotReopenableException,
} from '../exceptions/index.js';
import { JobOfferMapper } from '../mappers/job-offer.mapper.js';
import { JobOffersRepository } from '../repositories/job-offers.repository.js';
import type { CreateJobOfferRequest } from '../requests/create-job-offer.request.js';
import type { UpdateJobOfferRequest } from '../requests/update-job-offer.request.js';
import {
  DEFAULT_COMPANY_JOB_OFFERS_FILTERS,
  type ListCompanyJobOffersRequest,
} from '../requests/list-company-job-offers.request.js';
import type { JobOfferCreatedResponse } from '../responses/job-offer-created.response.js';
import type {
  JobOfferResponse,
  JobOfferSkillResponse,
  PublishedJobOfferResponse,
} from '../responses/job-offer.response.js';
import { JobOfferStatus } from '../types/job-offer.enum.js';
import type { UpdateJobOfferData } from '../types/update-job-offer-data.type.js';
import { formatSalaryRange } from '../utils/format-salary-range.js';
import { JobOfferSkillsService } from './job-offer-skills.service.js';

@Injectable()
export class JobOffersService {
  constructor(
    private readonly jobOffersRepository: JobOffersRepository,
    private readonly jobOfferSkillsService: JobOfferSkillsService,
    private readonly jobOfferMapper: JobOfferMapper,
    private readonly matchSource: JobOfferMatchRepository,
  ) {}

  findPublishedMatchById(id: string, now: Date) {
    return this.matchSource.findPublishedById(id, now);
  }
  findPublishedMatches(now: Date) {
    return this.matchSource.findPublished(now);
  }

   async create(
    companyId: string,
    request: CreateJobOfferRequest,
  ): Promise<JobOfferCreatedResponse> {
    const expiresAt = this.parseExpiresAt(request.expiresAt, new Date());
    await this.ensureCompanyExists(companyId);
    await this.jobOfferSkillsService.validateSkillIds(request.skillIds);

    const { modalityId, contractTypeId, statusId } =
      await this.jobOffersRepository.findCatalogIds(
        request.modality,
        request.contractType,
        JobOfferStatus.PUBLISHED,
      );
    if (!modalityId) throw new JobOfferCatalogNotFoundException('modalidad');
    if (!contractTypeId)
      throw new JobOfferCatalogNotFoundException('tipo de contrato');
    if (!statusId) throw new JobOfferCatalogNotFoundException('estado');

    const record = await this.jobOffersRepository.create({
      companyId,
      modalityId,
      contractTypeId,
      statusId,
      expiresAt,
      ...this.toOfferFields(request),
    });

    return this.jobOfferMapper.toCreatedResponse(record);
  }
  
  async closeExpiredOffers(now: Date = new Date()): Promise<number> {
    const [publishedStatusId, closedStatusId] = await Promise.all([
      this.jobOffersRepository.findStatusId(JobOfferStatus.PUBLISHED),
      this.jobOffersRepository.findStatusId(JobOfferStatus.CLOSED),
    ]);
    if (!publishedStatusId || !closedStatusId)
      throw new JobOfferCatalogNotFoundException('estado');

    return this.jobOffersRepository.closeExpired(
      publishedStatusId,
      closedStatusId,
      now,
    );
  }

  async listPublished(): Promise<PublishedJobOfferResponse[]> {
    const records = await this.jobOffersRepository.findPublished(new Date());
    return records.map((record) =>
      this.jobOfferMapper.toPublishedResponse(record),
    );
  }
  async listByCompany(
    companyId: string,
    filters: ListCompanyJobOffersRequest = DEFAULT_COMPANY_JOB_OFFERS_FILTERS,
  ): Promise<JobOfferResponse[]> {
    await this.ensureCompanyExists(companyId);
    const records = await this.jobOffersRepository.findByCompany(
      companyId,
      filters,
    );
    const responses = records.map((record) =>
      this.jobOfferMapper.toResponse(record),
    );
    if (filters.sortBy !== 'applicants') return responses;

    const direction = filters.order === 'asc' ? 1 : -1;
    return responses.sort(
      (a, b) => (a.applicantsCount - b.applicantsCount) * direction,
    );
  }

  async getByCompanyAndId(
    companyId: string,
    jobOfferId: string,
  ): Promise<JobOfferResponse> {
    await this.ensureCompanyExists(companyId);
    const record = await this.jobOffersRepository.findHistoryByCompanyAndId(
      companyId,
      jobOfferId,
    );
    if (!record) {
      throw new JobOfferNotFoundException();
    }
    return this.jobOfferMapper.toResponse(record);
  }

  async update(
    companyId: string,
    jobOfferId: string,
    request: UpdateJobOfferRequest,
  ): Promise<JobOfferResponse> {
    await this.ensureCompanyExists(companyId);
    const existing = await this.jobOffersRepository.findByCompanyAndId(
      companyId,
      jobOfferId,
    );
    if (!existing) throw new JobOfferNotFoundException();
    await this.jobOfferSkillsService.validateSkillIds(request.skillIds);

    const { modalityId, contractTypeId } =
      await this.jobOffersRepository.findCatalogIds(
        request.modality,
        request.contractType,
        JobOfferStatus.PUBLISHED,
      );
    if (!modalityId) throw new JobOfferCatalogNotFoundException('modalidad');
    if (!contractTypeId)
      throw new JobOfferCatalogNotFoundException('tipo de contrato');

    const record = await this.jobOffersRepository.update(jobOfferId, {
      modalityId,
      contractTypeId,
      ...this.toUpdateFields(request),
    });
    return this.jobOfferMapper.toResponse(record);
  }

  async softDelete(companyId: string, jobOfferId: string): Promise<void> {
    await this.ensureCompanyExists(companyId);
    const existing = await this.jobOffersRepository.findByCompanyAndId(
      companyId,
      jobOfferId,
    );
    if (!existing) {
      throw new JobOfferNotFoundException();
    }

    const statusId = await this.jobOffersRepository.findStatusId(
      JobOfferStatus.DELETED,
    );
    if (!statusId) {
      throw new JobOfferCatalogNotFoundException('estado');
    }

    await this.jobOffersRepository.updateStatus(jobOfferId, statusId);
  }

  async reopen(
    companyId: string,
    jobOfferId: string,
  ): Promise<JobOfferResponse> {
    await this.ensureCompanyExists(companyId);
    const existing = await this.jobOffersRepository.findByCompanyAndId(
      companyId,
      jobOfferId,
    );
    if (!existing) throw new JobOfferNotFoundException();
    if (existing.status.title !== JobOfferStatus.CLOSED)
      throw new JobOfferNotReopenableException();

    const statusId = await this.jobOffersRepository.findStatusId(
      JobOfferStatus.PUBLISHED,
    );
    if (!statusId) throw new JobOfferCatalogNotFoundException('estado');

    const now = new Date();
    const hasExpired =
      existing.expiresAt !== null &&
      existing.expiresAt.getTime() <= now.getTime();

    const record = await this.jobOffersRepository.reopen(
      jobOfferId,
      statusId,
      now,
      hasExpired,
    );
    return this.jobOfferMapper.toResponse(record);
  }

  findScoringOffers(ids: string[]) {
    return this.jobOffersRepository.findScoringOffers(ids);
  }

  findCompanyOffer(companyId: string, id: string) {
    return this.jobOffersRepository.findCompanyOffer(companyId, id);
  }

  listSkillCatalog(): Promise<JobOfferSkillResponse[]> {
    return this.jobOfferSkillsService.listCatalog();
  }

  private toOfferFields(request: CreateJobOfferRequest) {
    return {
      ...this.toBaseFields(request),
      requiredCareers: request.requiredCareers,
      minExperienceYears: request.minExperienceYears ?? null,
      otherRequirements: request.otherRequirements,
    };
  }

  private toUpdateFields(
    request: UpdateJobOfferRequest,
  ): Omit<UpdateJobOfferData, 'modalityId' | 'contractTypeId'> {
    return {
      ...this.toBaseFields(request),
      ...(request.requiredCareers !== undefined && {
        requiredCareers: request.requiredCareers,
      }),
      ...(request.minExperienceYears !== undefined && {
        minExperienceYears: request.minExperienceYears,
      }),
      ...(request.otherRequirements !== undefined && {
        otherRequirements: request.otherRequirements,
      }),
    };
  }

  private toBaseFields(request: UpdateJobOfferRequest) {
    return {
      title: request.title,
      description: request.description,
      category: request.category,
      positionsAvailable: request.positionsAvailable,
      salaryRange: formatSalaryRange(request.salaryMin, request.salaryMax),
      languages: request.languages,
      locationUrl: request.locationUrl,
      skillIds: request.skillIds,
    };
  }
  private parseExpiresAt(
    expiresAt: string | null | undefined,
    now: Date,
  ): Date | null {
    if (!expiresAt) return null;
    const date = new Date(expiresAt);
    if (date.getTime() <= now.getTime())
      throw new JobOfferExpiryInPastException();
    return date;
  }

  private async ensureCompanyExists(companyId: string): Promise<void> {
    const exists = await this.jobOffersRepository.companyExists(companyId);
    if (!exists) throw new CompanyNotFoundException();
  }

  activeRecruitmentVacancies() {
    return this.jobOffersRepository.activeRecruitmentVacancies();
  }

  recruiterVacancies(companyIds: string[]) {
    return this.jobOffersRepository.recruiterVacancies(companyIds);
  }

  publishedRecruitmentJob(jobId: string) {
    return this.jobOffersRepository.publishedRecruitmentJob(jobId);
  }

  companyExists(companyId: string) {
    return this.jobOffersRepository.companyExists(companyId);
  }
}
