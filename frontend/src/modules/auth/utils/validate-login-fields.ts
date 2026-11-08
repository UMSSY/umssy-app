import { LOGIN_EMAIL_PATTERN } from "../constants/login-validation.constants";

export type LoginFieldErrors = { email?: string; password?: string };

export function validateLoginFields(email: string, password: string): LoginFieldErrors {
  const errors: LoginFieldErrors = {};
  const trimmedEmail = email.trim();

  if (!trimmedEmail) errors.email = "Ingresa tu correo electrónico";
  else if (!LOGIN_EMAIL_PATTERN.test(trimmedEmail)) errors.email = "Ingresa un correo electrónico válido";

  if (!password) errors.password = "Ingresa tu contraseña";

  return errors;
}
