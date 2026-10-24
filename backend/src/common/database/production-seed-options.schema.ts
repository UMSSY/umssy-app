import { z } from 'zod';

export const ProductionSeedOptionsSchema = z.tuple([
  z.literal('--email'),
  z
    .email('El correo del administrador no es válido')
    .max(150)
    .transform((email) => email.trim().toLowerCase()),
]);
