export interface CompanyProfileMock {
  id: string;
  name: string;
  sector: string;
  city: string;
  phone: string;
  email: string;
  description: string;
  website: string | null;
  logoUrl: string | null;
}

export const MOCK_COMPANY_PROFILE: CompanyProfileMock = {
  id: '1',
  name: 'Innovación Tecnológica Bolivia S.R.L.',
  sector: 'Desarrollo de Software y Consultoría',
  city: 'Cochabamba',
  phone: '+591 4 4251234',
  email: 'contacto@innovacionbolivia.tech',
  description: 'Empresa líder dedicada al diseño y desarrollo de soluciones web de alto impacto, plataformas escalables y transformación digital para instituciones públicas y privadas en todo el país.',
  website: 'https://innovacionbolivia.tech',
  logoUrl: null, 
};