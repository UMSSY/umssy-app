import { Injectable } from '@nestjs/common';
import { MissingUserException } from '../../../common/exceptions/missing-user.exception.js';
import { VacanciesRepository } from '../repositories/vacancies.repository.js';
import { VacancyMatchingService } from './vacancy-matching.service.js';
import { VacancyNotFoundException } from '../exceptions/vacancy-not-found.exception.js';
import { experienceYears } from '../utils/experience-years.js';
import { compareVacancyRank } from '../utils/compare-vacancy-rank.js';

@Injectable()
export class VacanciesService {
  constructor(
    private readonly repository: VacanciesRepository,
    private readonly matching: VacancyMatchingService,
  ) {}

  async findRecommended(userId: string, page: number, limit: number) {
    const [vacancies, profile] = await Promise.all([
      this.repository.findActive(),
      this.profile(userId),
    ]);
    const ranked = vacancies
      .map((vacancy) => this.matching.match(vacancy, profile))
      .sort(compareVacancyRank);
    return {
      items: ranked.slice((page - 1) * limit, page * limit),
      total: ranked.length,
      page,
      limit,
    };
  }

  async findDetail(userId: string, id: string) {
    const [vacancy, profile] = await Promise.all([
      this.repository.findActiveById(id),
      this.profile(userId),
    ]);
    if (!vacancy) throw new VacancyNotFoundException();
    return this.matching.match(vacancy, profile);
  }

  private async profile(userId: string) {
    const record = await this.repository.findProfile(userId);
    if (!record) throw new MissingUserException();
    return {
      skills: [
        ...record.userSkills.map(({ skill }) => skill.name),
        ...record.workExperiences.flatMap(
          ({ detectedSkills }) => detectedSkills,
        ),
      ],
      academicQualifications: record.educations.map(({ degree }) => degree),
      submittedRequirements: [],
      experienceYears: experienceYears(record.workExperiences),
    };
  }
}
