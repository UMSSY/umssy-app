import { OTP_LENGTH } from "../constants/account-activation.constants";

// Deja solo dígitos y recorta al largo del código (sirve también para pegar desde el correo)
export function sanitizeOtp(value: string): string {
  return value.replace(/\D/g, "").slice(0, OTP_LENGTH);
}
