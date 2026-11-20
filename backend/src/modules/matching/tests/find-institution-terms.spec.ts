import { describe, expect, it } from 'vitest';
import { findInstitutionTerms } from '../utils/find-institution-terms.js';

describe('findInstitutionTerms', () => {
  it('une en un solo termino los nombres institucionales de varias palabras', () => {
    expect(findInstitutionTerms('Egresado de la Universidad Mayor de San Simón')).toEqual([
      'universidad_mayor_de_san_simon',
      'san_simon',
    ]);
  });

  it('reconoce el nombre sin tildes y con otras mayusculas', () => {
    expect(findInstitutionTerms('SAN SIMON')).toEqual(['san_simon']);
  });

  it('no incluye las siglas de una sola palabra', () => {
    expect(findInstitutionTerms('Titulado de la UMSS')).toEqual([]);
  });

  it('no detecta un nombre pegado a otras letras', () => {
    expect(findInstitutionTerms('sansimonita')).toEqual([]);
  });

  it.each([[''], ['   '], ['sin instituciones']])('devuelve vacio con %o', (text) => {
    expect(findInstitutionTerms(text)).toEqual([]);
  });
});
