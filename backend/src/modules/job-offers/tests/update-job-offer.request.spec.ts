import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { updateJobOfferSchema } from '../requests/update-job-offer.request.js';

const VALID_REQUEST = {
  title: 'DevOps Senior',
  description: 'Buscamos un perfil DevOps con Docker y Kubernetes.',
  modality: 'Híbrido',
  contractType: 'Tiempo completo',
  category: 'Tecnología',
  positionsAvailable: 2,
  salaryMin: 6500,
  salaryMax: 8000,
  languages: 'Español, inglés intermedio',
  locationUrl: 'https://maps.app.goo.gl/TechBolivia',
  skillIds: [randomUUID()],
};

describe('updateJobOfferSchema', () => {
  it('no rellena los requisitos que la edición no envía', () => {
    const result = updateJobOfferSchema.parse(VALID_REQUEST);

    expect(result.requiredCareers).toBeUndefined();
    expect(result.minExperienceYears).toBeUndefined();
    expect(result.otherRequirements).toBeUndefined();
  });

  it('conserva los requisitos cuando la edición sí los envía', () => {
    const result = updateJobOfferSchema.parse({
      ...VALID_REQUEST,
      requiredCareers: ['Ingeniería de Sistemas'],
      minExperienceYears: 2,
      otherRequirements: [],
    });

    expect(result.requiredCareers).toEqual(['Ingeniería de Sistemas']);
    expect(result.minExperienceYears).toBe(2);
    expect(result.otherRequirements).toEqual([]);
  });

  it('aplica las mismas reglas de salario que la publicación', () => {
    const invertedRange = updateJobOfferSchema.safeParse({
      ...VALID_REQUEST,
      salaryMin: 9000,
      salaryMax: 8000,
    });
    const missingSalary = updateJobOfferSchema.safeParse({
      ...VALID_REQUEST,
      salaryMin: undefined,
      salaryMax: undefined,
    });

    expect(invertedRange.success ? undefined : invertedRange.error.issues[0].message).toBe(
      'El salario mínimo no puede ser mayor al salario máximo',
    );
    expect(missingSalary.success ? undefined : missingSalary.error.issues[0].message).toBe(
      'Este campo es obligatorio',
    );
  });
});
