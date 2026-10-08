import { z } from 'zod';


const REQUIRED_MESSAGE = 'Este campo es obligatorio';


export const MODALITIES = ['ON_SITE', 'REMOTE', 'HYBRID'] as const;
export const CONTRACT_TYPES = ['FULL_TIME', 'PART_TIME', 'INTERNSHIP'] as const;


const SALARY_REGEX = /^Bs \d{1,3}(\.\d{3})*( - \d{1,3}(\.\d{3})*)?$/;


const parseSalaryAmount = (amount: string): number => Number(amount.replace(/\./g, ''));


function isValidGoogleMapsUrl(value: string): boolean {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:') return false;
    if (url.hostname === 'maps.google.com') return true;
    return url.hostname === 'goo.gl' && url.pathname.startsWith('/maps');
  } catch {
    return false;
  }
}

export const createVacancySchema = z
  .object({
    title: z
      .string({ message: REQUIRED_MESSAGE })
      .trim()
      .min(1, REQUIRED_MESSAGE)
      .max(60, 'El título no puede superar los 60 caracteres')
      // Letras, números (con tildes y ñ) y espacios
      .regex(/^[\p{L}\p{N} ]+$/u, 'Solo se permiten caracteres alfanuméricos y espacios'),

    modality: z.enum(MODALITIES, { message: 'Selecciona una modalidad válida' }),

    contractType: z.enum(CONTRACT_TYPES, { message: 'Selecciona un tipo de contrato válido' }),

    category: z.string({ message: REQUIRED_MESSAGE }).trim().min(1, REQUIRED_MESSAGE).max(100),

    positionsAvailable: z
      .number({ message: 'Ingresa un número válido' })
      .int('Debe ser un número entero')
      .min(1, 'El número mínimo de vacantes es 1')
      .max(500, 'El número máximo de vacantes por publicación es 500'),

    salaryRange: z
      .string({ message: REQUIRED_MESSAGE })
      .trim()
      .min(1, REQUIRED_MESSAGE)
      .regex(SALARY_REGEX, 'Formato de salario inválido (ej. Bs 6.500 - 8.000 o Bs 5.000)')
      .refine((value) => {
      
        if (!SALARY_REGEX.test(value)) return true;
        const [min, max] = value.replace('Bs ', '').split(' - ');
        return max === undefined || parseSalaryAmount(min) <= parseSalaryAmount(max);
      }, 'El salario mínimo no puede ser mayor al salario máximo'),

    languages: z
      .string({ message: REQUIRED_MESSAGE })
      .trim()
      .min(1, REQUIRED_MESSAGE)
      .max(100, 'Los idiomas no pueden superar los 100 caracteres'),

    locationUrl: z
      .string({ message: REQUIRED_MESSAGE })
      .trim()
      .min(1, REQUIRED_MESSAGE)
      .refine(isValidGoogleMapsUrl, 'Ingresa un enlace válido de Google Maps'),
  })
  
  .strict();

export type CreateVacancyPayload = z.infer<typeof createVacancySchema>;
