import { describe, expect, it } from 'vitest';
import { extractCvContact } from '../utils/extract-cv-contact.js';
import { splitCvPersonName } from '../utils/split-cv-person-name.js';

describe('extractCvContact', () => {
  it('reads name, email, phone and location from the header', () => {
    const header = [
      'CURRICULUM VITAE',
      'MARÍA FERNANDA LÓPEZ ROJAS',
      'maria.lopez@gmail.com | Cel: +591 712 34567',
      'Cochabamba, Bolivia',
    ];

    expect(extractCvContact(header, header)).toEqual({
      firstName: 'María Fernanda',
      lastName: 'López Rojas',
      email: 'maria.lopez@gmail.com',
      phone: '+591 712 34567',
      location: 'Cochabamba, Bolivia',
    });
  });

  it('uses labelled lines found anywhere in the cv', () => {
    const lines = [
      'Juan Pérez',
      'Experiencia',
      'Teléfono: 4-4251234',
      'Dirección: Av. América 123, Cochabamba',
    ];

    expect(extractCvContact(['Juan Pérez'], lines)).toMatchObject({
      firstName: 'Juan',
      lastName: 'Pérez',
      phone: '4-4251234',
      location: 'Av. América 123, Cochabamba',
    });
  });

  it('does not take date ranges as phone numbers', () => {
    expect(extractCvContact(['2018 - 2020'], []).phone).toBeNull();
  });

  it('returns nulls when nothing is found', () => {
    expect(extractCvContact([], [])).toEqual({
      firstName: null,
      lastName: null,
      email: null,
      phone: null,
      location: null,
    });
  });
});

describe('splitCvPersonName', () => {
  it.each([
    ['Juan Pérez', 'Juan', 'Pérez'],
    ['Juan Pérez García', 'Juan', 'Pérez García'],
    ['Ana María Quispe Mamani', 'Ana María', 'Quispe Mamani'],
  ])('splits "%s"', (fullName, firstName, lastName) => {
    expect(splitCvPersonName(fullName)).toEqual({ firstName, lastName });
  });
});
