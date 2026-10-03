import { Injectable } from '@nestjs/common';
import { CertificationNotFoundException } from '../exceptions/certification-not-found.exception.js';
import { CertificationMapper } from '../mappers/certification.mapper.js';
import { CertificationsRepository } from '../repositories/certifications.repository.js';
import type { CreateCertificationRequest } from '../requests/create-certification.request.js';
import type { UpdateCertificationRequest } from '../requests/update-certification.request.js';
import type { CertificationRecord } from '../types/certification-record.type.js';
import type { CertificationResponse } from '../types/certification-response.type.js';

@Injectable()
export class CertificationsService {
  constructor(
    private readonly certificationsRepository: CertificationsRepository,
    private readonly certificationMapper: CertificationMapper,
  ) {}

  async create(
    userId: string,
    request: CreateCertificationRequest,
  ): Promise<CertificationResponse> {
    const created = await this.certificationsRepository.create(userId, request);
    return this.certificationMapper.toResponse(created);
  }

  async findAll(userId: string): Promise<CertificationResponse[]> {
    const records =
      await this.certificationsRepository.findManyByUserId(userId);
    return this.certificationMapper.toResponseList(records);
  }

  async update(
    userId: string,
    id: string,
    request: UpdateCertificationRequest,
  ): Promise<CertificationResponse> {
    await this.getOwnedOrFail(userId, id);
    const updated = await this.certificationsRepository.update(id, request);
    return this.certificationMapper.toResponse(updated);
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.getOwnedOrFail(userId, id);
    await this.certificationsRepository.delete(id);
  }

  private async getOwnedOrFail(
    userId: string,
    id: string,
  ): Promise<CertificationRecord> {
    const record = await this.certificationsRepository.findById(id);

    if (!record || record.userId !== userId) {
      throw new CertificationNotFoundException();
    }

    return record;
  }
}
