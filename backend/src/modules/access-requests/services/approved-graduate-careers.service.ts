import { Injectable } from '@nestjs/common';
import { toApprovedGraduateCareers } from '../mappers/approved-graduate-career.mapper.js';
import { ApprovedGraduateCareersRepository } from '../repositories/approved-graduate-careers.repository.js';
import type { ApprovedGraduateCareer } from '../types/approved-graduate-career.types.js';

@Injectable()
export class ApprovedGraduateCareersService {
  constructor(private readonly repository: ApprovedGraduateCareersRepository) {}

  async findByUserIds(userIds: string[]): Promise<ApprovedGraduateCareer[]> {
    if (userIds.length === 0) return [];
    return toApprovedGraduateCareers(
      await this.repository.findByUserIds(userIds),
    );
  }
}
