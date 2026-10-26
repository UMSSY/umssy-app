import { z } from 'zod';
import { OTP_DIGITS } from '../constants/otp.constants.js';
import { accessRequestFields } from './access-request-fields.js';

const emailField = accessRequestFields.email;

const codeField = z
  .string({ error: 'El código es obligatorio' })
  .trim()
  .regex(new RegExp(`^\\d{${OTP_DIGITS}}$`), `El código debe tener ${OTP_DIGITS} dígitos`);

// Mismas reglas que la pantalla: 8 caracteres, una mayúscula y un número (CA6)
const passwordField = z
  .string({ error: 'La contraseña es obligatoria' })
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .max(64, 'La contraseña no puede superar los 64 caracteres')
  .regex(/[A-Z]/, 'La contraseña debe incluir una letra mayúscula')
  .regex(/\d/, 'La contraseña debe incluir un número');

export const activationStatusQuerySchema = z.object({ email: emailField });

export const verifyActivationCodeSchema = z.object({ email: emailField, code: codeField });

export const activateAccountSchema = z.object({ email: emailField, code: codeField, password: passwordField });

export const resendActivationCodeSchema = z.object({ email: emailField });

export type ActivationStatusQuery = z.infer<typeof activationStatusQuerySchema>;
export type VerifyActivationCodeDto = z.infer<typeof verifyActivationCodeSchema>;
export type ActivateAccountDto = z.infer<typeof activateAccountSchema>;
export type ResendActivationCodeDto = z.infer<typeof resendActivationCodeSchema>;