import { isDeliverableEmail } from '../utils/is-deliverable-email.js';

describe('isDeliverableEmail', () => {
  it.each([
    'titulado.1@umssy.test',
    'seed.user22@UMSSY.TEST',
    'seed.personal01@example.invalid',
    'admin@umssy.local',
    'dev@localhost',
    'qa@sub.example',
    'qa@example.com',
    'qa@mail.example.org',
    'qa@umssy.test.',
  ])('omite el dominio reservado de %s', (email) => {
    expect(isDeliverableEmail(email)).toBe(false);
  });

  it.each([
    'persona@gmail.com',
    '202108214@est.umss.edu',
    'docente@umss.edu.bo',
    'contacto@umssy.com',
    'qa@testing.com',
    'qa@myexample.com',
  ])('permite el correo real %s', (email) => {
    expect(isDeliverableEmail(email)).toBe(true);
  });

  it('rechaza un valor sin dominio', () => {
    expect(isDeliverableEmail('sin-arroba')).toBe(false);
    expect(isDeliverableEmail('usuario@')).toBe(false);
  });
});