import { afterEach, describe, expect, it, vi } from 'vitest';
import { Logger } from '@nestjs/common';
import nodemailer from 'nodemailer';
import { parseMailConfig } from '../../../config/mail.config.js';
import { MailService } from '../services/mail.service.js';
import { MailTemplateService } from '../services/mail-template.service.js';

const PRODUCTION_ENV = {
  NODE_ENV: 'production',
  MAIL_TRANSPORT: 'smtp',
  MAIL_FROM_ADDRESS: 'no-reply@example.com',
  SMTP_HOST: 'smtp-relay.brevo.com',
  SMTP_PORT: '587',
  SMTP_USER: 'smtp-login',
  SMTP_PASSWORD: 'smtp-key',
  SMTP_REQUIRE_TLS: 'true',
};

function createService(env: Record<string, string> = {}) {
  for (const name of Object.keys(process.env)) {
    if (name.startsWith('MAIL_') || name.startsWith('SMTP_'))
      vi.stubEnv(name, undefined);
  }
  vi.stubEnv('NODE_ENV', 'test');
  for (const [name, value] of Object.entries(env)) vi.stubEnv(name, value);
  return new MailService(new MailTemplateService());
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe('mail configuration', () => {
  it('accepts Brevo STARTTLS and implicit TLS', () => {
    expect(parseMailConfig(PRODUCTION_ENV)).toMatchObject({
      SMTP_PORT: 587,
      SMTP_SECURE: false,
      SMTP_REQUIRE_TLS: true,
    });
    expect(
      parseMailConfig({
        ...PRODUCTION_ENV,
        SMTP_SECURE: 'true',
        SMTP_PORT: '465',
      }).SMTP_SECURE,
    ).toBe(true);
  });

  it.each([
    { MAIL_TRANSPORT: 'console' },
    { MAIL_FROM_ADDRESS: undefined },
    { SMTP_HOST: '' },
    { SMTP_USER: '' },
    { SMTP_PASSWORD: '' },
    { SMTP_REQUIRE_TLS: 'false' },
  ])('rejects incomplete production settings: %o', (overrides) => {
    expect(() =>
      parseMailConfig({ ...PRODUCTION_ENV, ...overrides }),
    ).toThrow();
  });

  it.each([
    { SMTP_SECURE: 'yes' },
    { SMTP_PORT: 'bad' },
    { SMTP_PORT: '0' },
    { SMTP_USER: 'login' },
  ])('rejects invalid settings: %o', (env) =>
    expect(() => parseMailConfig(env)).toThrow(),
  );
});

const MESSAGE_MJML =
  '<mj-section><mj-column><mj-text>{{message}}</mj-text></mj-column></mj-section>';
const MAIL_PAYLOAD = {
  to: 'ana@example.com',
  subject: 'Mensaje de prueba',
  text: 'Contenido de prueba',
  mjml: MESSAGE_MJML,
  values: { message: 'Contenido de prueba' },
};

describe('MJML rendering', () => {
  const templates = new MailTemplateService();
  it('compiles supplied content with shared branding and no empty image', async () => {
    const html = await templates.render(MESSAGE_MJML, {
      brandName: 'UMSSY',
      logoUrl: '',
      message: 'Contenido de prueba',
    });
    expect(html).toContain('Contenido de prueba');
    expect(html).toContain('Inter');
    expect(html).not.toContain('<mj-');
    expect(html).not.toContain('{{');
    expect(html).not.toContain('<img');
  });

  it('escapes dynamic values and includes the configured logo', async () => {
    const html = await templates.render(MESSAGE_MJML, {
      brandName: 'UMSSY',
      logoUrl: 'https://example.com/logo.png',
      message:
        '<script>alert(1)</script><mj-include path="/etc/passwd" /> {{value}} & texto',
    });
    expect(html).toContain('https://example.com/logo.png');
    expect(html).toContain('&lt;script&gt;');
    expect(html).not.toContain('<script>');
    expect(html).toContain('{{value}}');
    expect(html).toContain('&amp; texto');
  });

  it('rejects missing template values', async () => {
    await expect(
      templates.render(MESSAGE_MJML, { brandName: 'UMSSY', logoUrl: '' }),
    ).rejects.toThrow('Missing');
  });
});

describe('mail delivery', () => {
  it('logs local messages without creating an SMTP connection', async () => {
    const transport = vi.spyOn(nodemailer, 'createTransport');
    const log = vi
      .spyOn(Logger.prototype, 'log')
      .mockImplementation(() => undefined);
    await createService().send(MAIL_PAYLOAD);
    expect(transport).not.toHaveBeenCalled();
    expect(log.mock.calls[0][0]).toContain('Contenido de prueba');
  });

  it('sends HTML and plain text with Brevo credentials and no body logs', async () => {
    const sendMail = vi
      .fn()
      .mockResolvedValue({ accepted: ['ana@example.com'], rejected: [] });
    const transport = vi
      .spyOn(nodemailer, 'createTransport')
      .mockReturnValue({ sendMail } as unknown as ReturnType<
        typeof nodemailer.createTransport
      >);
    const log = vi.spyOn(Logger.prototype, 'log');
    await createService({
      ...PRODUCTION_ENV,
      MAIL_REPLY_TO: 'help@example.com',
    }).send(MAIL_PAYLOAD);
    expect(transport).toHaveBeenCalledWith(
      expect.objectContaining({
        host: 'smtp-relay.brevo.com',
        port: 587,
        secure: false,
        requireTLS: true,
        auth: { user: 'smtp-login', pass: 'smtp-key' },
      }),
    );
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: { name: 'UMSSY', address: 'no-reply@example.com' },
        to: 'ana@example.com',
        replyTo: 'help@example.com',
        text: 'Contenido de prueba',
        html: expect.stringContaining('Contenido de prueba'),
      }),
    );
    expect(log).not.toHaveBeenCalled();
  });

  it('supports local SMTP without credentials', () => {
    const transport = vi
      .spyOn(nodemailer, 'createTransport')
      .mockReturnValue({} as ReturnType<typeof nodemailer.createTransport>);
    createService({ MAIL_TRANSPORT: 'smtp' });
    expect(transport).toHaveBeenCalledWith(
      expect.objectContaining({
        host: 'localhost',
        port: 1025,
        auth: undefined,
      }),
    );
  });

  it('propagates SMTP errors and rejected recipients', async () => {
    const sendMail = vi
      .fn()
      .mockRejectedValueOnce(new Error('SMTP unavailable'))
      .mockResolvedValueOnce({ accepted: [], rejected: ['ana@example.com'] });
    vi.spyOn(nodemailer, 'createTransport').mockReturnValue({
      sendMail,
    } as unknown as ReturnType<typeof nodemailer.createTransport>);
    const service = createService({ MAIL_TRANSPORT: 'smtp' });
    await expect(service.send(MAIL_PAYLOAD)).rejects.toThrow(
      'SMTP unavailable',
    );
    await expect(service.send(MAIL_PAYLOAD)).rejects.toThrow(
      'SMTP did not accept',
    );
  });
});
