import { describe, expect, it } from 'vitest';
import { evaluateRadarDocument } from '../utils/evaluate-radar-document.js';
const owner = {
  firstName: 'Lucía',
  lastName: 'Soria',
  sourceType: 'cv' as const,
  duplicate: false,
  issuer: null,
};
const skills = [{ id: 'docker', name: 'Docker', areaId: 'cloud-devops' }];
const cv = 'Curriculum vitae de Lucia Soria. Experiencia con Docker.';
describe('Decisiones HU5', () => {
  it('permite el umbral exacto cuando coinciden los datos y existe respaldo', () => {
    expect(evaluateRadarDocument(owner, cv, 0.6, skills).status).toBe(
      'approved',
    );
  });
  it('rechaza una medición inferior al mínimo y explica el motivo', () => {
    expect(evaluateRadarDocument(owner, cv, 0.599, skills)).toMatchObject({
      status: 'low_confidence',
      reason: expect.stringContaining('60 %'),
    });
  });
  it('envía un error técnico sin medición a revisión', () =>
    expect(evaluateRadarDocument(owner, '', null, []).status).toBe('review'));
  it.each([
    { ...owner, duplicate: true },
    { ...owner, lastName: 'Ríos' },
    { ...owner, sourceType: 'certification' as const, issuer: 'UMSS' },
  ])('deriva inconsistencias a revisión', (job) => {
    expect(evaluateRadarDocument(job, cv, 0.97, skills).status).toBe('review');
  });
  it('identifica un certificado del titular y la entidad emisora', () => {
    expect(
      evaluateRadarDocument(
        { ...owner, sourceType: 'certification', issuer: 'UMSS' },
        'Certificado UMSS. Lucía Soria. Docker.',
        0.94,
        skills,
      ).status,
    ).toBe('approved');
  });
});
