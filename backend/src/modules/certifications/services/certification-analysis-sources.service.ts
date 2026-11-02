import { Injectable } from '@nestjs/common';
import { CertificationsRepository } from '../repositories/certifications.repository.js';

/** Contrato público de lectura de certificaciones para el análisis NLP. */
@Injectable()
export class CertificationAnalysisSourcesService {
  constructor(private readonly repository: CertificationsRepository) {}

  findAnalysisSources(userId: string) {
    return this.repository.findManyByUserId(userId);
  }
}
