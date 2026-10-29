import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MailTemplateService } from '../../mail/services/mail-template.service.js';
import { buildFrontendUrl, frontendBaseUrl } from '../mail/helpers/frontend-url.js';
import { MailServiceSender } from '../mail/mail-service-sender.js';
import type { MailService } from '../../mail/services/mail.service.js';
import type { RejectionMailLinkService } from '../services/rejection-mail-link.service.js';
import {
  ACCOUNT_ACTIVATED_MJML,
  ACTIVATION_CODE_MJML,
  loadRejectionTemplate,
} from '../mail/templates/access-request-mails.template.js';

const NOW = new Date('2026-10-05T12:00:00.000Z');

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});

describe('frontendBaseUrl', () => {
  it('usa FRONTEND_URL cuando existe y le quita la barra final', () => {
    expect(frontendBaseUrl({ FRONTEND_URL: ' https://umssy.test/ ', CORS_ORIGIN: 'http://otro.test' })).toBe('https://umssy.test');
  });

  it('si no hay FRONTEND_URL toma el primer origen de CORS_ORIGIN', () => {
    expect(frontendBaseUrl({ CORS_ORIGIN: ' http://a.test , http://b.test' })).toBe('http://a.test');
  });

  it('sin configuración usa localhost:3000', () => {
    expect(frontendBaseUrl({})).toBe('http://localhost:3000');
    expect(frontendBaseUrl({ CORS_ORIGIN: ' , ' })).toBe('http://localhost:3000');
  });
});

describe('buildFrontendUrl', () => {
  it('arma la ruta y codifica los parámetros', () => {
    vi.stubEnv('FRONTEND_URL', 'https://umssy.test');
    expect(buildFrontendUrl('/request-access/activation', { email: 'ana.perez@est.umss.edu' })).toBe(
      'https://umssy.test/request-access/activation?email=ana.perez%40est.umss.edu',
    );
    expect(buildFrontendUrl('/login')).toBe('https://umssy.test/login');
  });
});

describe('MailServiceSender', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    vi.stubEnv('FRONTEND_URL', 'https://umssy.test');
  });

  function build() {
    const mailService = { send: vi.fn().mockResolvedValue(undefined) };
    const rejectionLinks = { forRecipient: vi.fn().mockResolvedValue({
      requestCode: 'SOL-2026-0001',
      url: `https://umssy.test/request-access/status?code=SOL-2026-0001#correctionToken=dcr1.${'x'.repeat(43)}`,
    }) };
    return { mailService, rejectionLinks, sender: new MailServiceSender(
      mailService as unknown as MailService, rejectionLinks as unknown as RejectionMailLinkService,
    ) };
  }

  it('envía el código con su vigencia en minutos y el enlace de activación', async () => {
    const { mailService, sender } = build();

    await sender.sendActivationCode('ana@umss.test', '482719', new Date(NOW.getTime() + 10 * 60_000));

    const payload = mailService.send.mock.calls[0][0];
    expect(payload).toMatchObject({
      to: 'ana@umss.test',
      mjml: ACTIVATION_CODE_MJML,
      values: {
        code: '482719',
        expiresInMinutes: '10',
        activationUrl: 'https://umssy.test/request-access/activation?email=ana%40umss.test',
      },
    });
    expect(payload.text).toContain('482719');
  });

  it('nunca informa menos de 1 minuto de vigencia', async () => {
    const { mailService, sender } = build();
    await sender.sendActivationCode('ana@umss.test', '482719', new Date(NOW.getTime() + 5_000));
    expect(mailService.send.mock.calls[0][0].values.expiresInMinutes).toBe('1');
  });

  it('envía la confirmación de cuenta activada con el enlace de inicio de sesión', async () => {
    const { mailService, sender } = build();

    await sender.sendAccountActivated('ana@umss.test', 'Ana');

    expect(mailService.send.mock.calls[0][0]).toMatchObject({
      to: 'ana@umss.test',
      mjml: ACCOUNT_ACTIVATED_MJML,
      values: { firstName: 'Ana', loginUrl: 'https://umssy.test/login' },
    });
  });

  it('envía el rechazo con el motivo y el enlace personal a Mi solicitud', async () => {
    const { mailService, sender } = build();

    await sender.sendRejection('ana@umss.test', 'Documento ilegible');

    expect(mailService.send.mock.calls[0][0]).toMatchObject({
      mjml: await loadRejectionTemplate(),
      values: {
        reason: 'Documento ilegible', requestCode: 'SOL-2026-0001',
        requestStatusUrl: `https://umssy.test/request-access/status?code=SOL-2026-0001#correctionToken=dcr1.${'x'.repeat(43)}`,
      },
    });
  });

  it('propaga el error cuando MailService no puede enviar', async () => {
    const { mailService, sender } = build();
    mailService.send.mockRejectedValue(new Error('smtp caído'));
    await expect(sender.sendAccountActivated('ana@umss.test', 'Ana')).rejects.toThrow('smtp caído');
  });
});

describe('plantillas MJML', () => {
  const brand = { brandName: 'UMSSY', logoUrl: 'https://umssy.test/logo.svg' };
  const templates = new MailTemplateService();

  it('el correo del código se genera con validación estricta e incluye el código y el botón', async () => {
    const html = await templates.render(ACTIVATION_CODE_MJML, {
      ...brand,
      code: '482719',
      expiresInMinutes: '10',
      activationUrl: 'https://umssy.test/request-access/activation?email=ana%40umss.test',
    });

    expect(html).toContain('482719');
    expect(html).toContain('10 minutos');
    expect(html).toContain('href="https://umssy.test/request-access/activation?email=ana%40umss.test"');
  });

  it('el correo de cuenta activada incluye el nombre y el enlace de inicio de sesión', async () => {
    const html = await templates.render(ACCOUNT_ACTIVATED_MJML, {
      ...brand,
      firstName: 'Ana',
      loginUrl: 'https://umssy.test/login',
    });

    expect(html).toContain('Hola Ana');
    expect(html).toContain('href="https://umssy.test/login"');
  });

  it('el correo de rechazo escapa el HTML del motivo', async () => {
    const html = await templates.render(await loadRejectionTemplate(), {
      ...brand,
      reason: '<script>alert(1)</script>',
      requestCode: 'SOL-2026-0001',
      requestStatusUrl: 'https://umssy.test/request-access/status?code=SOL-2026-0001',
    });

    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(html).not.toContain('<script>alert(1)');
  });
});
