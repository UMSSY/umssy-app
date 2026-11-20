import { Injectable } from '@nestjs/common';
import { UsersService } from '../../users/services/users.service.js';
import type { UserContact } from '../../users/types/user-contact.types.js';
import { SurveysRepository } from '../repositories/surveys.repository.js';
import type { SurveyAudience } from '../types/survey-audience.type.js';
import type { SurveyAudienceFilter } from '../types/survey-audience-filter.type.js';

@Injectable()
export class SurveyAudienceService {
  constructor(
    private readonly usersService: UsersService,
    private readonly surveysRepository: SurveysRepository,
  ) {}

  async resolve(filter: SurveyAudienceFilter): Promise<SurveyAudience> {
    const [eligible, respondentIds] = await Promise.all([
      this.findEligible(filter),
      this.surveysRepository.findRespondentIds(filter.surveyId),
    ]);
    const responded = new Set(respondentIds);
    const eligibleIds = new Set(eligible.map((member) => member.id));

    // Incluir respondentes de la encuesta que no estén en la lista de elegibles
    // para asegurar consistencia entre la tasa de participación y las respuestas registradas.
    // Esto evita que "0 de N hayan respondido" cuando existen respuestas de la audiencia objetivo.
    const missingRespondentIds = respondentIds.filter(
      (id) => !eligibleIds.has(id),
    );
    if (missingRespondentIds.length > 0) {
      const respondentContacts =
        await this.usersService.findActiveContactsByRoles({
          roles: filter.roles,
          userIds: missingRespondentIds,
        });
      for (const contact of respondentContacts) {
        if (!eligibleIds.has(contact.id)) {
          eligible.push(contact);
          eligibleIds.add(contact.id);
        }
      }
    }

    return {
      eligible,
      pending: eligible.filter((member) => !responded.has(member.id)),
    };
  }

  private async findEligible({
    roles,
    careerId,
    graduationYear,
  }: SurveyAudienceFilter): Promise<UserContact[]> {
    const userIds =
      careerId || graduationYear
        ? await this.surveysRepository.findApprovedGraduateUserIds({
            careerId,
            graduationYear,
          })
        : undefined;
    return this.usersService.findActiveContactsByRoles({ roles, userIds });
  }
}
