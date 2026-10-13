import { describe, expect, it } from 'vitest';
import { registerSchema } from '../requests/register.schema.js';

const account = { firstName: ' Ana ', lastName: 'Perez', email: 'ANA@example.com', password: 'Prueba123', roleTag: 'estudiante' };

describe('registerSchema', () => {
  it('normaliza el correo y los nombres', () => {
    expect(registerSchema.parse(account)).toMatchObject({ firstName: 'Ana', email: 'ana@example.com' });
  });
  it.each(['administrativo', 'mentor', 'empresa'])('rechaza el rol %s en el registro publico', (roleTag) => {
    expect(registerSchema.safeParse({ ...account, roleTag }).success).toBe(false);
  });
  it('rechaza contraseñas cortas y las que exceden el limite de bcrypt', () => {
    expect(registerSchema.safeParse({ ...account, password: '123' }).success).toBe(false);
    expect(registerSchema.safeParse({ ...account, password: 'ñ'.repeat(40) }).success).toBe(false);
  });
});
