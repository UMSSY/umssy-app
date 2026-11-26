import { describe, expect, it } from 'vitest';
import type { FeaturedCompanyRecord } from '../types/featured-company-record.type.js';
import { toFeaturedCompanies } from '../utils/to-featured-companies.js';

function record(
  id: string,
  title: string,
  extra: Partial<FeaturedCompanyRecord> = {},
): FeaturedCompanyRecord {
  return { id, title, description: null, profile: null, logo: null, ...extra };
}

describe('toFeaturedCompanies', () => {
  it('ordena por cantidad de vacantes vigentes y desempata por nombre', () => {
    const result = toFeaturedCompanies(
      [
        record('c', 'Cóndor Labs'),
        record('a', 'Andes Data'),
        record('b', 'Bolívar Soft'),
      ],
      [
        { companyId: 'a', activeOffers: 1 },
        { companyId: 'b', activeOffers: 4 },
        { companyId: 'c', activeOffers: 1 },
      ],
    );

    expect(result.map(({ id }) => id)).toEqual(['b', 'a', 'c']);
  });

  it('devuelve como máximo tres empresas', () => {
    const records = ['a', 'b', 'c', 'd'].map((id) => record(id, id));
    const counts = records.map(({ id }) => ({
      companyId: id,
      activeOffers: 1,
    }));

    expect(toFeaturedCompanies(records, counts)).toHaveLength(3);
  });

  it('arma la ruta del logo y deja en null la descripción vacía', () => {
    const [company] = toFeaturedCompanies(
      [
        record('a', 'Andes Data', {
          description: '  ',
          profile: { sector: 'Software' },
          logo: { id: 'logo-1' },
        }),
      ],
      [{ companyId: 'a', activeOffers: 2 }],
    );

    expect(company).toEqual({
      id: 'a',
      name: 'Andes Data',
      sector: 'Software',
      description: null,
      logoUrl: '/companies/a/logo',
      activeVacanciesCount: 2,
    });
  });

  it('descarta empresas sin vacantes vigentes', () => {
    expect(toFeaturedCompanies([record('a', 'Andes Data')], [])).toEqual([]);
  });
});
