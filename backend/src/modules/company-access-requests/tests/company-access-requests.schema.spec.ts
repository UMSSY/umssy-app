import { describe, expect, it } from 'vitest';
import {
  activateCompanyAccountSchema,
  createCompanyAccessRequestSchema,
  listCompanyAccessRequestsQuerySchema,
  rejectCompanyAccessRequestSchema,
  reportInconsistencySchema,
  requestCorrectionSchema,
  updateCompanyAccessRequestSchema,
} from '../requests/create-company-access-request.schema.js';

describe('company-access-requests schemas', () => {
  const validUuid = '11111111-1111-4111-8111-111111111111';

  describe('createCompanyAccessRequestSchema', () => {
    const validData = {
      companyName: 'Acme Corp',
      sector: 'Tecnología',
      cityId: validUuid,
      description: 'Empresa dedicada al desarrollo de software y servicios cloud',
      email: 'contacto@acme.com',
      phone: '71234567',
      websiteUrl: 'https://acme.com',
      username: 'acme_user',
    };

    it('valida datos correctos', () => {
      const parsed = createCompanyAccessRequestSchema.safeParse(validData);
      expect(parsed.success).toBe(true);
    });

    it('permite websiteUrl vacío', () => {
      const parsed = createCompanyAccessRequestSchema.safeParse({
        ...validData,
        websiteUrl: '',
      });
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.websiteUrl).toBe('');
      }
    });

    it('falla con nombre de empresa demasiado corto', () => {
      const parsed = createCompanyAccessRequestSchema.safeParse({
        ...validData,
        companyName: 'A',
      });
      expect(parsed.success).toBe(false);
    });

    it('falla con teléfono boliviano inválido', () => {
      const parsed = createCompanyAccessRequestSchema.safeParse({
        ...validData,
        phone: '12345',
      });
      expect(parsed.success).toBe(false);
    });

    it('falla con correo inválido', () => {
      const parsed = createCompanyAccessRequestSchema.safeParse({
        ...validData,
        email: 'invalido',
      });
      expect(parsed.success).toBe(false);
    });

    it('falla con usuario con caracteres prohibidos', () => {
      const parsed = createCompanyAccessRequestSchema.safeParse({
        ...validData,
        username: 'user with spaces!',
      });
      expect(parsed.success).toBe(false);
    });

    it('falla con URL mal formateada', () => {
      const parsed = createCompanyAccessRequestSchema.safeParse({
        ...validData,
        websiteUrl: 'htt://invalida',
      });
      expect(parsed.success).toBe(false);
    });
  });

  describe('updateCompanyAccessRequestSchema', () => {
    it('permite actualización parcial con datos válidos', () => {
      const parsed = updateCompanyAccessRequestSchema.safeParse({
        companyName: 'Nueva Razón Social',
        phone: '77654321',
      });
      expect(parsed.success).toBe(true);
    });

    it('falla con teléfono inválido en actualización', () => {
      const parsed = updateCompanyAccessRequestSchema.safeParse({
        phone: '999',
      });
      expect(parsed.success).toBe(false);
    });
  });

  describe('activateCompanyAccountSchema', () => {
    const validActivation = {
      requestCode: 'EMP-2026-0001',
      email: 'test@empresa.com',
      code: '123456',
      password: 'Password123!',
    };

    it('valida payload de activación completo', () => {
      const parsed = activateCompanyAccountSchema.safeParse(validActivation);
      expect(parsed.success).toBe(true);
    });

    it('falla si el código no tiene 6 dígitos', () => {
      const parsed = activateCompanyAccountSchema.safeParse({
        ...validActivation,
        code: '123',
      });
      expect(parsed.success).toBe(false);
    });

    it('falla con contraseña menor a 8 caracteres', () => {
      const parsed = activateCompanyAccountSchema.safeParse({
        ...validActivation,
        password: 'short',
      });
      expect(parsed.success).toBe(false);
    });
  });

  describe('requestCorrectionSchema y rejectCompanyAccessRequestSchema', () => {
    it('valida solicitud de corrección', () => {
      const parsed = requestCorrectionSchema.safeParse({
        reasonCategory: 'Documento borroso',
        customDetails: 'La imagen de la carta no es legible en la firma',
      });
      expect(parsed.success).toBe(true);
    });

    it('falla si el detalle de corrección es menor a 10 caracteres', () => {
      const parsed = requestCorrectionSchema.safeParse({
        reasonCategory: 'Documento',
        customDetails: 'corto',
      });
      expect(parsed.success).toBe(false);
    });

    it('valida rechazo con motivo opcional', () => {
      const parsed = rejectCompanyAccessRequestSchema.safeParse({
        reason: 'Empresa no acreditada',
      });
      expect(parsed.success).toBe(true);
    });
  });

  describe('reportInconsistencySchema', () => {
    it('valida reporte de inconsistencia', () => {
      const parsed = reportInconsistencySchema.safeParse({
        requestCode: 'EMP-2026-0001',
        email: 'empresa@test.com',
        observation: 'El representante legal cambió de dirección',
      });
      expect(parsed.success).toBe(true);
    });
  });

  describe('listCompanyAccessRequestsQuerySchema', () => {
    it('aplica valores por defecto', () => {
      const parsed = listCompanyAccessRequestsQuerySchema.safeParse({});
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.page).toBe(1);
        expect(parsed.data.limit).toBe(10);
        expect(parsed.data.status).toBe('ALL');
      }
    });

    it('coacciona números y acepta filtros válidos', () => {
      const parsed = listCompanyAccessRequestsQuerySchema.safeParse({
        page: '2',
        limit: '25',
        status: 'PENDING',
        search: 'Andes',
      });
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.page).toBe(2);
        expect(parsed.data.limit).toBe(25);
        expect(parsed.data.status).toBe('PENDING');
        expect(parsed.data.search).toBe('Andes');
      }
    });
  });
});
