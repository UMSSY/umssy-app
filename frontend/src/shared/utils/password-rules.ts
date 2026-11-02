import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "../constants/password.constants";

export interface PasswordRule {
  id: string;
  label: string;
  met: boolean;
}

export function getPasswordRules(password: string): PasswordRule[] {
  return [
    { id: "length", label: `Mínimo ${PASSWORD_MIN_LENGTH} caracteres`, met: password.length >= PASSWORD_MIN_LENGTH },
    { id: "uppercase", label: "Al menos una letra mayúscula", met: /[A-Z]/.test(password) },
    { id: "digit", label: "Al menos un número", met: /\d/.test(password) },
  ];
}

export interface PasswordErrors {
  password?: string;
  confirm?: string;
}

export function validatePasswords(password: string, confirm: string): PasswordErrors {
  const errors: PasswordErrors = {};
  if (password.length > PASSWORD_MAX_LENGTH) {
    errors.password = `Usa como máximo ${PASSWORD_MAX_LENGTH} caracteres`;
  } else if (getPasswordRules(password).some((rule) => !rule.met)) {
    errors.password = "La contraseña no cumple los requisitos";
  }
  if (confirm !== password) {
    errors.confirm = "Las contraseñas no coinciden";
  }
  return errors;
}
