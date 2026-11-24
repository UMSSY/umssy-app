import { describe, expect, it } from 'vitest';
import { DomainException } from '../../../common/exceptions/domain.exception.js';
import { JobAlertSkillsRequiredException } from '../exceptions/job-alert-skills-required.exception.js';

describe('JobAlertSkillsRequiredException', () => {
  it('es una excepción de dominio 422 con el mensaje del criterio AC-15.6', () => {
    const exception = new JobAlertSkillsRequiredException();

    expect(exception).toBeInstanceOf(DomainException);
    expect(exception.statusCode).toBe(422);
    expect(exception.code).toBe('JOB_ALERT_SKILLS_REQUIRED');
    expect(exception.message).toBe(
      'Para activar estas opciones, añade al menos una habilidad a tu perfil.',
    );
  });
});
