import { z } from 'zod';

export const createJobOfferSchema = z.object({
  tituloPuesto: z
    .string()
    .min(1, 'Este campo es obligatorio')
    .max(60, 'El titulo del puesto no debe exceder los 60 caracteres')
    .regex(
      /^[a-zA-Z0-9\s]+$/,
      'Solo se permiten caracteres alfanumericos y espacios'
    ),
  descripcion: z
    .string()
    .min(1, 'Este campo es obligatorio')
    .max(3000, 'La descripcion no debe exceder los 3000 caracteres'),
  modalidad: z.enum(['Presencial', 'Remoto', 'Hibrido'], {
    message: 'Modalidad invalida',
  }),
  ubicacion: z.string().min(1, 'Este campo es obligatorio'),
  tipoContrato: z.enum(['Tiempo completo', 'Medio tiempo', 'Pasantia'], {
    message: 'Tipo de contrato invalido',
  }),
  categoria: z.string().min(1, 'Este campo es obligatorio'),
  numeroVacantes: z
    .number()
    .int('Debe ser un numero entero')
    .min(1, 'Debe ser al menos 1')
    .max(500, 'El numero maximo de vacantes por publicacion es 500'),
  salarioMin: z.number().nonnegative(),
  salarioMax: z.number().nonnegative(),
  idiomas: z
    .string()
    .max(100, 'Los idiomas no deben exceder los 100 caracteres'),
  enlaceGoogleMaps: z
    .string()
    .url('Ingresa un enlace valido de Google Maps')
    .refine(
      (url) =>
        url.includes('https://maps.google.com/') ||
        url.includes('https://goo.gl/maps/'),
      { message: 'Ingresa un enlace valido de Google Maps' }
    ),
  tecnologias: z
    .array(z.string())
    .min(1, 'Debes seleccionar al menos una habilidad requerida')
    .max(10, 'Se alcanzo el tope de tecnologias'),
});

export type CreateJobOfferPayload = z.infer<typeof createJobOfferSchema>;