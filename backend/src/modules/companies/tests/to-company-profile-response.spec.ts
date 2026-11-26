import { describe, expect, it } from 'vitest';
import type { CompanyProfileRecord } from '../types/company-profile-record.type.js';
import { toCompanyProfileResponse } from '../utils/to-company-profile-response.js';

const COMPANY_ID = '5f0c8a52-3d4b-4c1e-9a7f-2b6d8e1c4a90';

describe('toCompanyProfileResponse', () => {
  it('arma el perfil completo con la ruta del logo', () => {
    const record = {
      id: COMPANY_ID,
      title: 'Tech Andina',
      description: 'Software a medida',
      profile: {
        sector: 'Software',
        email: 'contacto@techandina.bo',
        phone: '44251234',
        websiteUrl: 'https://techandina.bo',
        city: { title: 'Cochabamba' },
      },
      logo: { id: 'logo-1' },
    } as CompanyProfileRecord;

    expect(toCompanyProfileResponse(record)).toEqual({
      id: COMPANY_ID,
      name: 'Tech Andina',
      description: 'Software a medida',
      sector: 'Software',
      city: 'Cochabamba',
      phone: '44251234',
      email: 'contacto@techandina.bo',
      website: 'https://techandina.bo',
      logoUrl: `/companies/${COMPANY_ID}/logo`,
    });
  });

  it('devuelve null en lo que la empresa no registró', () => {
    const record = {
      id: COMPANY_ID,
      title: 'Empresa Demo',
      description: '   ',
      profile: {
        sector: 'Banca',
        email: 'info@demo.bo',
        phone: '77712345',
        websiteUrl: '',
        city: { title: 'La Paz' },
      },
      logo: null,
    } as CompanyProfileRecord;

    expect(toCompanyProfileResponse(record)).toMatchObject({
      description: null,
      website: null,
      logoUrl: null,
    });
  });

  it('deja el contacto en null si la empresa no tiene perfil', () => {
    const record = {
      id: COMPANY_ID,
      title: 'Empresa Demo',
      description: null,
      profile: null,
      logo: null,
    } as CompanyProfileRecord;

    expect(toCompanyProfileResponse(record)).toEqual({
      id: COMPANY_ID,
      name: 'Empresa Demo',
      description: null,
      sector: null,
      city: null,
      phone: null,
      email: null,
      website: null,
      logoUrl: null,
    });
  });
});
