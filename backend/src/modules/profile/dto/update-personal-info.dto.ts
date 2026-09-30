import { z } from 'zod';
import { emailAddress, personName, phoneNumber } from './profile-rules.js';

export const updatePersonalInfoSchema = z.object({
  firstName: personName('El nombre'),
  lastName: personName('El apellido'),
  cityId: z.uuid({ error: 'Selecciona tu ciudad de residencia.' }),
  phone: phoneNumber,
  personalEmail: emailAddress,
});

export type UpdatePersonalInfoDto = z.infer<typeof updatePersonalInfoSchema>;
