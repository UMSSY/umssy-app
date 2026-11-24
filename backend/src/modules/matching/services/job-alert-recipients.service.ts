import { Injectable, Logger } from '@nestjs/common';
import { UsersService } from '../../users/services/users.service.js';
import {
  JOB_ALERT_RECIPIENT_ROLES,
  JOB_ALERT_SCORING_BATCH_SIZE,
} from '../constants/job-alert-preference.constants.js';
import type { JobAlertMode } from '../enums/job-alert-mode.enum.js';
import { JobAlertPreferencesRepository } from '../repositories/job-alert-preferences.repository.js';
import type { JobMatchRecord } from '../types/job-match.types.js';
import { chunkList } from '../utils/chunk-list.js';
import { parseJobAlertMode } from '../utils/parse-job-alert-mode.js';
import { passesJobAlertFilter } from '../utils/passes-job-alert-filter.js';
import { VacancyScoringService } from './vacancy-scoring.service.js';

type FilteredRecipient = { userId: string; mode: JobAlertMode };

@Injectable()
export class JobAlertRecipientsService {
  private readonly logger = new Logger(JobAlertRecipientsService.name);

  constructor(
    private readonly users: UsersService,
    private readonly repository: JobAlertPreferencesRepository,
    private readonly vacancyScoring: VacancyScoringService,
  ) {}

  async resolve(vacancy: JobMatchRecord): Promise<string[]> {
    const [contacts, filteredModes] = await Promise.all([
      this.users.findActiveContactsByRoles({ roles: JOB_ALERT_RECIPIENT_ROLES }),
      this.repository.findFilteredModes(),
    ]);

    const everyone: string[] = [];
    const withFilter: FilteredRecipient[] = [];
    for (const { id } of contacts) {
      const storedMode = filteredModes.get(id);
      if (storedMode === undefined) everyone.push(id);
      else withFilter.push({ userId: id, mode: parseJobAlertMode(storedMode) });
    }

    const accepted = await this.filterByAffinity(vacancy, withFilter);
    return [...everyone, ...accepted];
  }

  private async filterByAffinity(
    vacancy: JobMatchRecord,
    recipients: FilteredRecipient[],
  ): Promise<string[]> {
    const accepted: string[] = [];
    for (const batch of chunkList(recipients, JOB_ALERT_SCORING_BATCH_SIZE)) {
      const results = await Promise.all(
        batch.map(({ userId, mode }) => this.accepts(vacancy, userId, mode)),
      );
      batch.forEach(({ userId }, index) => {
        if (results[index]) accepted.push(userId);
      });
    }
    return accepted;
  }

  private async accepts(
    vacancy: JobMatchRecord,
    userId: string,
    mode: JobAlertMode,
  ): Promise<boolean> {
    try {
      const candidate = await this.vacancyScoring.getCandidate(userId);
      if (candidate.skills.length === 0) return true;
      const { score } = await this.vacancyScoring.evaluate(vacancy, candidate);
      return passesJobAlertFilter(mode, score);
    } catch (error) {
      this.logger.warn(
        `No se pudo calcular la afinidad de la vacante ${vacancy.id} para un usuario: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return false;
    }
  }
}
