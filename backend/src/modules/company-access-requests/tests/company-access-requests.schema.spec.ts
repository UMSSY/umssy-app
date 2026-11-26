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

    const issueMessages = (input: unknown) => {
      const parsed = createCompanyAccessRequestSchema.safeParse(input);
      return parsed.success ? [] : parsed.error.issues.map((i) => i.message);
    };

    describe('nombre de la empresa (HU18 CA2)', () => {
      it.each(['Acme', 'A'.repeat(30), 'Tech & Co.', "O'Brien, S.R.L.", 'Andes-Tech (Bolivia)', 'Ñandú 2000'])(
        'acepta %s',
        (companyName) => {
          expect(createCompanyAccessRequestSchema.safeParse({ ...validData, companyName }).success).toBe(true);
        },
      );

      it.each(['A', 'Abc', 'A'.repeat(31), '    ', '  ab  ', '....', '@@@@@', 'Acme <script>', 'Acme_Corp'])(
        'rechaza %j',
        (companyName) => {
          expect(createCompanyAccessRequestSchema.safeParse({ ...validData, companyName }).success).toBe(false);
        },
      );

      it('recorta espacios antes de medir el largo', () => {
        const parsed = createCompanyAccessRequestSchema.safeParse({ ...validData, companyName: '   Acme   ' });
        expect(parsed.success && parsed.data.companyName).toBe('Acme');
      });

      it('informa el rango permitido del nombre', () => {
        expect(issueMessages({ ...validData, companyName: 'abc' })).toContain(
          'El nombre de la empresa debe tener entre 4 y 30 caracteres',
        );
      });
    });

    describe('descripción (HU18 CA2)', () => {
      it.each(['d'.repeat(10), 'd'.repeat(500)])('acepta %d caracteres', (description) => {
        expect(createCompanyAccessRequestSchema.safeParse({ ...validData, description }).success).toBe(true);
      });

      it.each(['d'.repeat(9), 'd'.repeat(501), '           ', ' abc '])('rechaza %j', (description) => {
        expect(createCompanyAccessRequestSchema.safeParse({ ...validData, description }).success).toBe(false);
      });

      it('informa el rango permitido de la descripción', () => {
        expect(issueMessages({ ...validData, description: 'corta' })).toContain(
          'La descripción debe tener entre 10 y 500 caracteres',
        );
      });
    });

    describe('sitio web obligatorio (HU18 CA3)', () => {
      it.each(['', '   '])('rechaza %j', (websiteUrl) => {
        expect(issueMessages({ ...validData, websiteUrl })).toContain('El sitio web es obligatorio');
      });

      it('rechaza si se omite el campo', () => {
        const { websiteUrl: _omitted, ...withoutWebsite } = validData;
        expect(createCompanyAccessRequestSchema.safeParse(withoutWebsite).success).toBe(false);
      });

      it.each(['htt://invalida', 'www.empresa.com', 'https://sinpunto', 'https://'])('rechaza %s', (websiteUrl) => {
        expect(createCompanyAccessRequestSchema.safeParse({ ...validData, websiteUrl }).success).toBe(false);
      });

      it('acepta una URL válida con espacios alrededor', () => {
        const parsed = createCompanyAccessRequestSchema.safeParse({ ...validData, websiteUrl: ' https://www.acme.com ' });
        expect(parsed.success && parsed.data.websiteUrl).toBe('https://www.acme.com');
      });
    });

    describe('teléfono (HU18 CA22)', () => {
      it.each(['60000000', '71234567', '79999999'])('acepta el celular %s', (phone) => {
        expect(createCompanyAccessRequestSchema.safeParse({ ...validData, phone }).success).toBe(true);
      });

      it.each(['4123456', '44123456', '2123456', '5123456', '8123456', '7123456', '712345678', '7123 4567', '7123456a', '+59171234567', '12345', ''])(
        'rechaza %j',
        (phone) => {
          expect(issueMessages({ ...validData, phone })).toContain('Ingresa un teléfono válido de 8 dígitos');
        },
      );
    });

    describe('usuario (HU18 CA24)', () => {
      it.each(['acme', 'Acme_User', 'a'.concat('b'.repeat(19)), 'user_01', 'a1_b'])('acepta %s', (username) => {
        expect(createCompanyAccessRequestSchema.safeParse({ ...validData, username }).success).toBe(true);
      });

      it.each(['abc', 'a'.concat('b'.repeat(20)), '1abc', '_abc', 'acme.user', 'acme-user', 'user with spaces', 'ácme', 'acme!', ''])(
        'rechaza %j',
        (username) => {
          expect(issueMessages({ ...validData, username })).toContain(
            'Debe contener entre 4 y 20 caracteres, comenzar con una letra y usar solo letras, números y guion bajo',
          );
        },
      );
    });

    it('falla con correo inválido', () => {
      const parsed = createCompanyAccessRequestSchema.safeParse({
        ...validData,
        email: 'invalido',
      });
      expect(parsed.success).toBe(false);
    });

    it('conserva las reglas del rubro y la ciudad', () => {
      expect(createCompanyAccessRequestSchema.safeParse({ ...validData, sector: 'x' }).success).toBe(false);
      expect(createCompanyAccessRequestSchema.safeParse({ ...validData, cityId: 'no-uuid' }).success).toBe(false);
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

    it('permite un cuerpo vacío', () => {
      expect(updateCompanyAccessRequestSchema.safeParse({}).success).toBe(true);
    });

    it('falla con teléfono inválido en actualización', () => {
      expect(updateCompanyAccessRequestSchema.safeParse({ phone: '999' }).success).toBe(false);
      expect(updateCompanyAccessRequestSchema.safeParse({ phone: '4123456' }).success).toBe(false);
    });

    it.each([
      ['companyName', 'abc'],
      ['companyName', 'A'.repeat(31)],
      ['companyName', '    '],
      ['description', 'd'.repeat(501)],
      ['description', 'd'.repeat(9)],
      ['websiteUrl', ''],
      ['websiteUrl', '   '],
      ['websiteUrl', 'sin-protocolo.com'],
      ['username', 'ab'],
      ['username', 'acme.user'],
      ['username', '9acme'],
    ])('rechaza %s = %j en actualización', (field, value) => {
      expect(updateCompanyAccessRequestSchema.safeParse({ [field]: value }).success).toBe(false);
    });

    it('acepta valores en el límite en actualización', () => {
      const parsed = updateCompanyAccessRequestSchema.safeParse({
        companyName: 'A'.repeat(4),
        description: 'd'.repeat(500),
        websiteUrl: 'https://acme.com',
        username: 'abcd',
      });
      expect(parsed.success).toBe(true);
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
