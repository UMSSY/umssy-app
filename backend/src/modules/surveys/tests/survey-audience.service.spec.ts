import { describe, expect, it, vi } from 'vitest';
import type { ApprovedGraduateCareersService } from '../../access-requests/services/approved-graduate-careers.service.js';
import type { UsersService } from '../../users/services/users.service.js';
import type { SurveysRepository } from '../repositories/surveys.repository.js';
import { SurveyAudienceService } from '../services/survey-audience.service.js';

const contact = (id: string) => ({
  id,
  email: `${id}@umss.edu.bo`,
  firstName: 'Nombre',
  lastName: 'Apellido',
});

function createService() {
  const usersService = {
    findActiveContactsByRoles: vi
      .fn()
      .mockResolvedValue([contact('user-1'), contact('user-2')]),
  };
  const approvedGraduates = {
    findApprovedUserIds: vi.fn().mockResolvedValue(['user-1', 'user-2']),
  };
  const repository = {
    findRespondentIds: vi.fn().mockResolvedValue(['user-1', 'user-9']),
  };
  const service = new SurveyAudienceService(
    usersService as unknown as UsersService,
    approvedGraduates as unknown as ApprovedGraduateCareersService,
    repository as unknown as SurveysRepository,
  );
  return { service, usersService, approvedGraduates, repository };
}

describe('SurveyAudienceService', () => {
  it('compone la audiencia con los dominios de usuarios y solicitudes aprobadas', async () => {
    const { service, usersService, approvedGraduates, repository } =
      createService();

    await expect(
      service.resolve({
        surveyId: 'survey-1',
        roles: ['titulado'],
        careerId: 'career-1',
        graduationYear: 2020,
      }),
    ).resolves.toEqual({
      eligible: [contact('user-1'), contact('user-2')],
      pending: [contact('user-2')],
    });
    expect(approvedGraduates.findApprovedUserIds).toHaveBeenCalledWith({
      careerId: 'career-1',
      graduationYear: 2020,
    });
    expect(usersService.findActiveContactsByRoles).toHaveBeenCalledWith({
      roles: ['titulado'],
      userIds: ['user-1', 'user-2'],
    });
    expect(repository.findRespondentIds).toHaveBeenCalledWith('survey-1');
  });

  it('no consulta solicitudes aprobadas cuando la encuesta no filtra cohorte', async () => {
    const { service, usersService, approvedGraduates } = createService();

    await service.resolve({
      surveyId: 'survey-1',
      roles: ['titulado', 'estudiante'],
      careerId: null,
      graduationYear: null,
    });

    expect(approvedGraduates.findApprovedUserIds).not.toHaveBeenCalled();
    expect(usersService.findActiveContactsByRoles).toHaveBeenCalledWith({
      roles: ['titulado', 'estudiante'],
      userIds: undefined,
    });
  });
});
