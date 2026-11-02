import { Injectable } from '@nestjs/common';
import { RadarEvidenceSourcesRepository } from './radar-evidence-sources.repository.js';

/** Lectura autorizada de evidencias del Radar desde otros dominios. */
@Injectable()
export class RadarEvidenceSourcesService {
  constructor(private readonly repository: RadarEvidenceSourcesRepository) {}

  findCurrentCvText(userId: string) {
    return this.repository.findCurrentCvText(userId);
  }
}
