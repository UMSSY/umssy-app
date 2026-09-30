import { updatePersonalInfoSchema } from './update-personal-info.dto.js';
import { updatePresentationSchema } from './update-presentation.dto.js';

const VALID_PERSONAL_INFO = {
  firstName: 'Valeria',
  lastName: 'Quispe',
  cityId: '0b8f6a52-1f0e-4c7a-8d9b-3e2f1a0c9b8d',
  phone: '+591 700 00000',
  personalEmail: 'nombre@correo.com',
};

function firstMessage(result: {
  success: boolean;
  error?: { issues: { message: string }[] };
}) {
  return result.error?.issues[0]?.message;
}

describe('updatePersonalInfoSchema', () => {
  it('accepts valid data and trims the text', () => {
    const result = updatePersonalInfoSchema.parse({
      ...VALID_PERSONAL_INFO,
      firstName: '  Valeria  ',
    });

    expect(result.firstName).toBe('Valeria');
  });

  it('requires every field', () => {
    const result = updatePersonalInfoSchema.safeParse({});

    expect(result.success).toBe(false);
    const fields = result.error?.issues.map((issue) => issue.path[0]);
    expect(fields).toEqual([
      'firstName',
      'lastName',
      'cityId',
      'phone',
      'personalEmail',
    ]);
  });

  it('reports a single "required" message for blank names', () => {
    const result = updatePersonalInfoSchema.safeParse({
      ...VALID_PERSONAL_INFO,
      firstName: '   ',
    });

    expect(result.error?.issues).toHaveLength(1);
    expect(firstMessage(result)).toBe('El nombre es obligatorio.');
  });

  it('rejects names with digits', () => {
    const result = updatePersonalInfoSchema.safeParse({
      ...VALID_PERSONAL_INFO,
      lastName: 'Quispe2',
    });

    expect(firstMessage(result)).toBe(
      'El apellido solo puede contener letras y espacios.',
    );
  });

  it.each([
    [
      '70a00000',
      'El teléfono solo puede contener números, espacios, guiones y +.',
    ],
    ['12345', 'El teléfono debe tener entre 7 y 15 dígitos.'],
  ])('rejects the invalid phone %s', (phone, message) => {
    const result = updatePersonalInfoSchema.safeParse({
      ...VALID_PERSONAL_INFO,
      phone,
    });

    expect(firstMessage(result)).toBe(message);
  });

  it('rejects an invalid email', () => {
    const result = updatePersonalInfoSchema.safeParse({
      ...VALID_PERSONAL_INFO,
      personalEmail: 'correo-invalido',
    });

    expect(firstMessage(result)).toBe('Ingresa un correo electrónico válido.');
  });

  it('rejects an invalid city id', () => {
    const result = updatePersonalInfoSchema.safeParse({
      ...VALID_PERSONAL_INFO,
      cityId: 'cochabamba',
    });

    expect(firstMessage(result)).toBe('Selecciona tu ciudad de residencia.');
  });
});

describe('updatePresentationSchema', () => {
  const validPresentation = {
    headline: 'Desarrolladora web junior',
    aboutMe: 'Soy egresada de Ingeniería de Sistemas de la UMSS.',
  };

  it('normalizes empty opportunities to null', () => {
    const result = updatePresentationSchema.parse({
      ...validPresentation,
      interestedOpportunities: '   ',
    });

    expect(result.interestedOpportunities).toBeNull();
  });

  it('keeps the opportunities text when present', () => {
    const result = updatePresentationSchema.parse({
      ...validPresentation,
      interestedOpportunities: 'Prácticas en desarrollo frontend',
    });

    expect(result.interestedOpportunities).toBe(
      'Prácticas en desarrollo frontend',
    );
  });

  it('requires a long enough about me section', () => {
    const result = updatePresentationSchema.safeParse({
      ...validPresentation,
      aboutMe: 'Muy corto',
    });

    expect(firstMessage(result)).toBe(
      'El campo "Acerca de" debe tener al menos 20 caracteres.',
    );
  });

  it('limits the headline length', () => {
    const result = updatePresentationSchema.safeParse({
      ...validPresentation,
      headline: 'a'.repeat(121),
    });

    expect(firstMessage(result)).toBe(
      'El titular profesional no puede superar los 120 caracteres.',
    );
  });
});
