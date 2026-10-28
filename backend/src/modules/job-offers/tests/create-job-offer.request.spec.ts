import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { createJobOfferSchema } from '../requests/create-job-offer.request.js';

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

function parse(overrides: Record<string, unknown>) {
  return createJobOfferSchema.safeParse({ ...VALID_REQUEST, ...overrides });
}

function firstMessage(overrides: Record<string, unknown>) {
  const result = parse(overrides);
  return result.success ? undefined : result.error.issues[0].message;
}

describe('createJobOfferSchema', () => {
  it('acepta una vacante válida', () => {
    expect(parse({}).success).toBe(true);
  });

  it('acepta un salario fijo sin máximo', () => {
    expect(parse({ salaryMax: undefined }).success).toBe(true);
  });

  it('recorta los espacios de los textos', () => {
    const result = createJobOfferSchema.parse({ ...VALID_REQUEST, title: '  DevOps  ' });

    expect(result.title).toBe('DevOps');
  });

  it('exige los textos obligatorios aunque solo tengan espacios', () => {
    for (const field of ['title', 'description', 'category', 'languages', 'locationUrl']) {
      expect(firstMessage({ [field]: '   ' })).toBe('Este campo es obligatorio');
    }
  });

  it('valida el título: longitud y caracteres', () => {
    expect(firstMessage({ title: 'a'.repeat(61) })).toMatch(/60/);
    expect(firstMessage({ title: 'Dev@' })).toMatch(/alfanuméricos/);
    expect(parse({ title: 'Ingeniero Peña' }).success).toBe(true);
  });

  it('limita la descripción y los idiomas', () => {
    expect(firstMessage({ description: 'a'.repeat(3001) })).toMatch(/3000/);
    expect(firstMessage({ languages: 'a'.repeat(101) })).toMatch(/100/);
  });

  it('solo acepta las modalidades y tipos de contrato del catálogo', () => {
    expect(firstMessage({ modality: 'Hibrido' })).toBe('Modalidad inválida');
    expect(firstMessage({ contractType: 'Pasantia' })).toBe('Tipo de contrato inválido');
    expect(parse({ modality: 'Remoto', contractType: 'Pasantía' }).success).toBe(true);
  });

  it('exige entre 1 y 500 vacantes enteras', () => {
    expect(firstMessage({ positionsAvailable: 0 })).toBe('Debe ser al menos 1');
    expect(firstMessage({ positionsAvailable: 501 })).toMatch(/500/);
    expect(firstMessage({ positionsAvailable: 1.5 })).toBe('Debe ser un número entero');
  });

  it('exige un salario mayor a 0 y un rango ordenado', () => {
    expect(firstMessage({ salaryMin: 0 })).toBe('El salario debe ser mayor a 0');
    expect(firstMessage({ salaryMax: 1_000_000_000 })).toBe('El salario no puede tener más de 9 dígitos');
    expect(firstMessage({ salaryMin: 9000, salaryMax: 8000 })).toBe(
      'El salario mínimo no puede ser mayor al salario máximo',
    );
  });

  it('exige salario salvo en pasantías, donde es opcional', () => {
    expect(firstMessage({ salaryMin: undefined, salaryMax: undefined })).toBe('Este campo es obligatorio');
    expect(
      parse({ contractType: 'Pasantía', salaryMin: undefined, salaryMax: undefined }).success,
    ).toBe(true);
    expect(firstMessage({ contractType: 'Pasantía', salaryMin: undefined })).toBe(
      'Este campo es obligatorio',
    );
  });

  it('acepta los enlaces oficiales de Google Maps y rechaza otros', () => {
    for (const locationUrl of [
      'https://maps.app.goo.gl/abc?g_st=iw',
      'https://goo.gl/maps/abc',
      'https://www.google.com/maps/place/Plaza+14+de+Septiembre/@-17.3935,-66.157,17z/data=!3m1',
      'https://www.google.com.bo/maps/place/UMSS/@-17.39,-66.14,15.5z?entry=ttu',
    ]) {
      expect(parse({ locationUrl }).success).toBe(true);
    }
    for (const locationUrl of [
      'https://ejemplo.com',
      'http://maps.app.goo.gl/abc',
      'https://maps.google.com/URLnoEXISTE',
      'https://www.google.com/maps/place/x',
      'https://maps.app.goo.gl.evil.com/x',
    ]) {
      expect(firstMessage({ locationUrl })).toBe('Ingresa un enlace válido de Google Maps');
    }
  });

  it('exige entre 1 y 10 habilidades con identificadores válidos', () => {
    expect(firstMessage({ skillIds: [] })).toBe('Debes seleccionar al menos una habilidad requerida');
    expect(firstMessage({ skillIds: Array.from({ length: 11 }, () => randomUUID()) })).toMatch(/10/);
    expect(firstMessage({ skillIds: ['Docker'] })).toBe('El identificador de la habilidad no es válido');
  });

  it('los requisitos de carrera, experiencia y otros son opcionales', () => {
    const result = createJobOfferSchema.parse(VALID_REQUEST);

    expect(result.requiredCareers).toEqual([]);
    expect(result.otherRequirements).toEqual([]);
    expect(result.minExperienceYears).toBeUndefined();
  });

  it('acepta carreras, años mínimos y otros requisitos y recorta los espacios', () => {
    const result = createJobOfferSchema.parse({
      ...VALID_REQUEST,
      requiredCareers: ['  Ingeniería de Sistemas  '],
      minExperienceYears: 3,
      otherRequirements: [' Carta de motivación '],
    });

    expect(result.requiredCareers).toEqual(['Ingeniería de Sistemas']);
    expect(result.minExperienceYears).toBe(3);
    expect(result.otherRequirements).toEqual(['Carta de motivación']);
  });

  it('valida los años mínimos de experiencia: entero entre 0 y 40', () => {
    expect(parse({ minExperienceYears: 0 }).success).toBe(true);
    expect(firstMessage({ minExperienceYears: 1.5 })).toBe('Los años de experiencia deben ser un número entero');
    expect(firstMessage({ minExperienceYears: -1 })).toMatch(/entre 0 y 40/);
    expect(firstMessage({ minExperienceYears: 41 })).toMatch(/entre 0 y 40/);
  });

  it('limita la cantidad y la longitud de los requisitos', () => {
    expect(firstMessage({ requiredCareers: Array.from({ length: 11 }, (_, index) => `Carrera ${index}`) })).toMatch(/10/);
    expect(firstMessage({ otherRequirements: ['a'.repeat(121)] })).toMatch(/120/);
    expect(parse({ requiredCareers: [''] }).success).toBe(false);
  });
});
