import { describe, expect, it } from 'vitest';
import { NotificationType } from '../../notifications/types/notification-type.enum.js';
import {
  COMPANY_REQUEST_APPROVED_TEMPLATE,
  COMPANY_REQUEST_OBSERVED_TEMPLATE,
  COMPANY_REQUEST_REJECTED_TEMPLATE,
  companyRequestApprovedNotification,
  companyRequestObservedNotification,
  companyRequestRejectedNotification,
} from '../notification/company-request-notifications.js';

describe('companyRequestNotifications', () => {
  it('valida payload y renderiza plantilla aprobada con MJML', async () => {
    const notification = companyRequestApprovedNotification({
      companyName: 'Tech Andina S.R.L.',
      requestCode: 'EMP-2026-0001',
      activationCode: '654321',
      expiresInMinutes: '2880',
      activationUrl:
        'https://umssy.local/request-access/activacion-empresa?email=hr%40techandina.bo&otp=654321',
    });

    expect(notification.type).toBe(
      NotificationType.COMPANY_ACCESS_REQUEST_APPROVED,
    );
    expect(
      COMPANY_REQUEST_APPROVED_TEMPLATE.renderTitle(notification.payload),
    ).toBe('Solicitud de empresa aprobada');
    expect(
      COMPANY_REQUEST_APPROVED_TEMPLATE.renderBody(notification.payload),
    ).toContain('Tech Andina S.R.L.');

    const mail = await notification.renderMail();
    expect(mail.subject).toBe('Tu código de activación de UMSSY para empresa');
    expect(mail.mjml).toContain('{{ code }}');
    expect(mail.values).toMatchObject({
      companyName: 'Tech Andina S.R.L.',
      requestCode: 'EMP-2026-0001',
      code: '654321',
    });
    expect(mail.text).toContain('EMP-2026-0001');
  });

  it('valida payload y renderiza plantilla observada', async () => {
    const notification = companyRequestObservedNotification({
      companyName: 'Tech Andina S.R.L.',
      requestCode: 'EMP-2026-0002',
      reason: '[DOCUMENTO] Falta sello institucional',
      requestStatusUrl:
        'https://umssy.local/request-access/status?code=EMP-2026-0002',
    });

    expect(notification.type).toBe(
      NotificationType.COMPANY_ACCESS_REQUEST_OBSERVED,
    );
    expect(
      COMPANY_REQUEST_OBSERVED_TEMPLATE.renderTitle(notification.payload),
    ).toContain('Observaciones');

    const mail = await notification.renderMail();
    expect(mail.subject).toContain('Observaciones');
    expect(mail.mjml).toContain('{{ reason }}');
    expect(mail.values?.reason).toContain('Falta sello institucional');
    expect(mail.text).toContain('Falta sello institucional');
  });

  it('valida payload y renderiza plantilla rechazada', async () => {
    const notification = companyRequestRejectedNotification({
      companyName: 'Tech Andina S.R.L.',
      requestCode: 'EMP-2026-0003',
      reason: 'NIT no verificable',
      requestStatusUrl:
        'https://umssy.local/request-access/status?code=EMP-2026-0003',
    });

    expect(notification.type).toBe(
      NotificationType.COMPANY_ACCESS_REQUEST_REJECTED,
    );
    expect(
      COMPANY_REQUEST_REJECTED_TEMPLATE.renderTitle(notification.payload),
    ).toContain('rechazada');

    const mail = await notification.renderMail();
    expect(mail.subject).toContain('Dictamen');
    expect(mail.mjml).toContain('{{ reason }}');
    expect(mail.values?.reason).toBe('NIT no verificable');
    expect(mail.text).toContain('NIT no verificable');
  });

  it('rechaza payloads inválidos mediante esquemas Zod', () => {
    expect(() =>
      companyRequestApprovedNotification({
        companyName: '',
        requestCode: 'EMP-2026-0001',
        activationCode: '654321',
        expiresInMinutes: '2880',
        activationUrl: 'not-a-url',
      }),
    ).toThrow();
  });
});
