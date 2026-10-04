import { Injectable } from '@nestjs/common';
import { TechnicalAreasRepository } from '../repositories/technical-areas.repository.js';
import { TechnicalAreasMapper } from '../mappers/technical-areas.mapper.js';
import type { TechnicalAreaResponse } from '../types/technical-area.type.js';

@Injectable()
export class TechnicalAreasService {
  constructor(
    private readonly technicalAreasRepository: TechnicalAreasRepository,
    private readonly technicalAreasMapper: TechnicalAreasMapper,
  ) {}

  async findAll(): Promise<TechnicalAreaResponse[]> {
    const records = await this.technicalAreasRepository.findAll();
    return this.technicalAreasMapper.toResponseList(records);
  }
}