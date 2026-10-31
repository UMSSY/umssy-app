import { describe, expect, it } from 'vitest';
import {
  activateAccountSchema,
  activationStatusQuerySchema,
  resendActivationCodeSchema,
  verifyActivationCodeSchema,
} from '../requests/activation.schema.js';

const VALID = { email: 'ana@umss.test', code: '482719', password: 'Jackson2026' };

function messages(result: { success: boolean; error?: { issues: { message: string }[] } }) {
  return result.error?.issues.map((issue) => issue.message) ?? [];
}

describe('esquemas de activación de cuenta', () => {
  it('normaliza el correo a minúsculas y sin espacios', () => {
    expect(activationStatusQuerySchema.parse({ email: '  Ana@UMSS.test ' })).toEqual({ email: 'ana@umss.test' });
    expect(resendActivationCodeSchema.parse({ email: 'ANA@umss.test' })).toEqual({ email: 'ana@umss.test' });
  });

  it('rechaza un correo con formato inválido o ausente', () => {
    expect(activationStatusQuerySchema.safeParse({ email: 'no-es-correo' }).success).toBe(false);
    expect(messages(activationStatusQuerySchema.safeParse({}))).toContain('El correo es obligatorio');
  });

  it('acepta un código de exactamente 6 dígitos', () => {
    expect(verifyActivationCodeSchema.parse({ email: VALID.email, code: ' 012345 ' }).code).toBe('012345');
  });

  it.each(['12345', '1234567', 'abc123', '12 456', ''])('rechaza el código %j', (code) => {
    const result = verifyActivationCodeSchema.safeParse({ email: VALID.email, code });
    expect(result.success).toBe(false);
  });

  it('acepta una contraseña con 8 caracteres, una mayúscula y un número', () => {
    expect(activateAccountSchema.safeParse(VALID).success).toBe(true);
    expect(activateAccountSchema.safeParse({ ...VALID, password: 'Abcdefg1' }).success).toBe(true);
  });

  it('informa qué requisito de la contraseña falta', () => {
    expect(messages(activateAccountSchema.safeParse({ ...VALID, password: 'Ab1' }))).toContain(
      'La contraseña debe tener al menos 8 caracteres',
    );
    expect(messages(activateAccountSchema.safeParse({ ...VALID, password: 'jackson2026' }))).toContain(
      'La contraseña debe incluir una letra mayúscula',
    );
    expect(messages(activateAccountSchema.safeParse({ ...VALID, password: 'JacksonJackson' }))).toContain(
      'La contraseña debe incluir un número',
    );
  });

  it('rechaza contraseñas de más de 64 caracteres', () => {
    expect(activateAccountSchema.safeParse({ ...VALID, password: `A1${'a'.repeat(63)}` }).success).toBe(false);
  });

  it('no recorta los espacios de la contraseña', () => {
    expect(activateAccountSchema.parse({ ...VALID, password: ' Jackson2026 ' }).password).toBe(' Jackson2026 ');
  });

  it('exige todos los campos para activar', () => {
    expect(activateAccountSchema.safeParse({ email: VALID.email, code: VALID.code }).success).toBe(false);
    expect(activateAccountSchema.safeParse({ code: VALID.code, password: VALID.password }).success).toBe(false);
  });
});