import { describe, expect, it } from 'vitest';
import { CompanyDocumentOcrService } from '../services/company-document-ocr.service.js';

describe('CompanyDocumentOcrService', () => {
  const service = new CompanyDocumentOcrService();

  const declaredData = {
    companyName: 'Andes Tech Innovación & Desarrollo S.R.L.',
    city: 'Cochabamba',
    email: 'contacto@andestech.bo',
    phone: '71234567',
    sector: 'Tecnología y Software',
    websiteUrl: 'https://andestech.bo',
  };

  it('evalúa positivamente un documento formal con todas las coincidencias', () => {
    const documentText = `
      ANDES TECH INNOVACIÓN & DESARROLLO S.R.L.
      NIT: 3948572019
      Av. Ballivián N° 789, Cochabamba, Bolivia
      Teléfono: 71234567 - 4567890
      Correo: contacto@andestech.bo
      Web: https://andestech.bo
      Rubro: servicios de desarrollo de software
      REF: SOLICITUD FORMAL DE REGISTRO INSTITUCIONAL Y VINCULACIÓN EN PLATAFORMA
      Dirigido a: Comisión de Inserción Laboral y Convenios UMSS
    `;

    const result = service.evaluateDocumentText(documentText, declaredData);

    expect(result.matchScore).toBeGreaterThanOrEqual(80);
    expect(result.fields.companyName.matched).toBe(true);
    expect(result.fields.city.matched).toBe(true);
    expect(result.fields.email.matched).toBe(true);
    expect(result.fields.phone.matched).toBe(true);
    expect(result.fields.sector.matched).toBe(true);
    expect(result.fields.websiteUrl.matched).toBe(true);
    expect(result.fields.requestIntent.matched).toBe(true);
  });

  it('maneja documentos vacíos o irrelevantes con baja puntuación', () => {
    const documentText = 'Este es un texto sin datos de empresa.';
    const result = service.evaluateDocumentText(documentText, declaredData);

    expect(result.matchScore).toBeLessThan(50);
    expect(result.fields.companyName.matched).toBe(false);
  });

  it('evalúa correctamente cuando el websiteUrl declarado está vacío', () => {
    const dataWithoutUrl = { ...declaredData, websiteUrl: '' };
    const documentText = `
      ANDES TECH INNOVACIÓN & DESARROLLO S.R.L.
      Cochabamba, Bolivia
      Teléfono: 71234567
      Email: contacto@andestech.bo
      Sector: Software y Tecnología
      SOLICITUD FORMAL DE REGISTRO
    `;

    const result = service.evaluateDocumentText(documentText, dataWithoutUrl);
    expect(result.fields.websiteUrl.matched).toBe(true);
    expect(result.fields.websiteUrl.statusMessage).toContain('validada');
  });

  it('tolera discrepancias de acentos y mayúsculas en el nombre de empresa', () => {
    const documentText = 'Empresa: ANDES TECH INNOVACION & DESARROLLO SRL en Cochabamba';
    const result = service.evaluateDocumentText(documentText, declaredData);
    expect(result.fields.companyName.matched).toBe(true);
  });
});
