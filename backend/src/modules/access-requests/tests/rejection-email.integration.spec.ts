import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { type SendMailOptions } from 'nodemailer';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MailService } from '../../mail/services/mail.service.js';
import { MailTemplateService } from '../../mail/services/mail-template.service.js';
import { RejectionMailContextService } from '../mail/rejection-mail-context.service.js';
import { MailServiceSender } from '../mail/mail-service-sender.js';
import { DocumentCorrectionRepository } from '../repositories/document-correction.repository.js';
import { RejectionMailRepository } from '../repositories/rejection-mail.repository.js';
import { DocumentCorrectionAuthorizationService } from '../services/document-correction-authorization.service.js';
import { RejectionMailLinkService } from '../services/rejection-mail-link.service.js';
import { RejectionNotificationService } from '../services/rejection-notification.service.js';
import { CORRECTION_TEST_SECRET, correctionSnapshot } from './document-correction.fixture.js';

function stringContent(value: unknown): string {
  if (typeof value !== 'string') throw new Error('Se esperaba contenido de correo en texto.');
  return value;
}

function notificationRecord(id = 'request-1', code = 'SOL-2026-0139', email = 'ana@example.com', reason = 'Documento ilegible') {
  return { snapshot: { ...correctionSnapshot({ id, requestCode: code }), reviewedBy: null }, email, reason };
}

function build(records = [notificationRecord()]) {
  const sendMail = vi.fn<(message: SendMailOptions) => Promise<{ accepted: string[]; rejected: string[] }>>()
    .mockResolvedValue({ accepted: ['ana@example.com'], rejected: [] });
  vi.spyOn(nodemailer, 'createTransport').mockReturnValue({ sendMail } as unknown as ReturnType<typeof nodemailer.createTransport>);
  const context = new RejectionMailContextService();
  const correctionRepository = {
    findById: vi.fn(async (id: string) => records.find((row) => row.snapshot.id === id)?.snapshot ?? null),
    findByCode: vi.fn(async (code: string) => records.find((row) => row.snapshot.requestCode === code)?.snapshot ?? null),
  };
  const rejectionRepository = { findById: vi.fn(async (id: string) => {
    const row = records.find((item) => item.snapshot.id === id);
    return row ? { email: row.email, rejectionReason: row.reason, updatedAt: row.snapshot.updatedAt } : null;
  }) };
  const authorization = new DocumentCorrectionAuthorizationService(
    correctionRepository as unknown as DocumentCorrectionRepository,
    new ConfigService({ JWT_SECRET: CORRECTION_TEST_SECRET }),
  );
  const links = new RejectionMailLinkService(context, rejectionRepository as unknown as RejectionMailRepository, authorization);
  const templates = new MailTemplateService();
  const sender = new MailServiceSender(new MailService(templates), links);
  const notification = new RejectionNotificationService(sender, context);
  return { notification, sender, context, authorization, sendMail, records, templates };
}

beforeEach(() => {
  // Aísla las credenciales: todas las entregas usan el transporte simulado.
  for (const name of Object.keys(process.env)) {
    if (name.startsWith('MAIL_') || name.startsWith('SMTP_')) vi.stubEnv(name, undefined);
  }
  vi.stubEnv('NODE_ENV', 'test');
  vi.stubEnv('MAIL_TRANSPORT', 'smtp');
  vi.stubEnv('SMTP_HOST', 'localhost');
  vi.stubEnv('SMTP_PORT', '1025');
  vi.stubEnv('FRONTEND_URL', 'https://umssy.test');
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); });

describe('B3: notificación, permiso B2 y renderizado con transporte simulado', () => {
  it('entrega HTML y texto con un permiso real de B2 para la solicitud exacta', async () => {
    const { notification, sender, authorization, sendMail, records } = build();
    const call = vi.spyOn(sender, 'sendRejection');
    await expect(notification.notify('ana@example.com', 'Documento ilegible', 'request-1')).resolves.toBe(true);
    expect(call).toHaveBeenCalledWith('ana@example.com', 'Documento ilegible');
    expect(sendMail).toHaveBeenCalledTimes(1);
    const message = sendMail.mock.calls[0][0];
    expect(message.to).toBe('ana@example.com');
    const text = stringContent(message.text);
    const rawUrl = text.match(/https:\/\/umssy\.test\/\S+/)?.[0];
    expect(rawUrl).toBeTruthy();
    const url = new URL(rawUrl!);
    const token = new URLSearchParams(url.hash.slice(1)).get('correctionToken');
    expect(url.pathname).toBe('/request-access/status');
    expect([...url.searchParams]).toEqual([['code', 'SOL-2026-0139']]);
    expect(stringContent(message.html)).toContain(`href="${rawUrl}"`);
    expect(text).toContain('Documento ilegible');
    await expect(authorization.authorize('SOL-2026-0139', `Bearer ${token}`)).resolves.toMatchObject({ accessRequestId: 'request-1' });
    // Enviar el correo no modifica el estado ni consume el permiso.
    expect(records[0].snapshot.status.title).toBe('rejected');
    await expect(authorization.authorize('SOL-2026-0139', `Bearer ${token}`)).resolves.toBeDefined();
  });

  it('mantiene aislados dos rechazos concurrentes para un mismo correo', async () => {
    const { notification, sendMail } = build([
      notificationRecord('first', 'SOL-2026-0001', 'ana@example.com', 'Motivo primero'),
      notificationRecord('second', 'SOL-2026-0002', 'ana@example.com', 'Motivo segundo'),
    ]);
    expect(await Promise.all([
      notification.notify('ana@example.com', 'Motivo primero', 'first'),
      notification.notify('ana@example.com', 'Motivo segundo', 'second'),
    ])).toEqual([true, true]);
    const messages = sendMail.mock.calls.map(([message]) => stringContent(message.text));
    expect(messages).toHaveLength(2);
    const first = messages.find((message) => message.includes('Motivo primero'))!;
    const second = messages.find((message) => message.includes('Motivo segundo'))!;
    expect(first).toContain('code=SOL-2026-0001');
    expect(first).not.toContain('SOL-2026-0002');
    expect(second).toContain('code=SOL-2026-0002');
    expect(second).not.toContain('SOL-2026-0001');
  });

  it('un fallo SMTP devuelve false y no registra el correo, motivo ni permiso en el error', async () => {
    const log = vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    const { notification, sendMail, records, context } = build();
    sendMail.mockRejectedValue(new Error('ana@example.com Documento ilegible #correctionToken=secreto'));
    await expect(notification.notify('ana@example.com', 'Documento ilegible', 'request-1')).resolves.toBe(false);
    expect(records[0].snapshot.status.title).toBe('rejected');
    expect(context.getCurrent()).toBeUndefined();
    expect(log).toHaveBeenCalledWith('No se pudo enviar el correo de rechazo de la solicitud request-1');
    expect(JSON.stringify(log.mock.calls)).not.toMatch(/ana@example|Documento ilegible|correctionToken|secreto/);
  });

  it('no entrega un permiso al destinatario de otra solicitud', async () => {
    vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    const { notification, sendMail } = build();
    await expect(notification.notify('otra@example.com', 'Documento ilegible', 'request-1')).resolves.toBe(false);
    expect(sendMail).not.toHaveBeenCalled();
  });

  it('no manda un correo con motivo anterior ni una solicitud que ya dejó de estar rechazada', async () => {
    vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    const { notification, sendMail, records } = build();
    await expect(notification.notify('ana@example.com', 'Motivo anterior', 'request-1')).resolves.toBe(false);
    records[0].snapshot.status = { title: 'pending' };
    await expect(notification.notify('ana@example.com', 'Documento ilegible', 'request-1')).resolves.toBe(false);
    expect(sendMail).not.toHaveBeenCalled();
  });

  it('controla un fallo de renderizado sin enviar contenido incompleto', async () => {
    vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    const { notification, sendMail, templates, records } = build();
    vi.spyOn(templates, 'render').mockRejectedValueOnce(new Error('Plantilla no disponible'));
    await expect(notification.notify('ana@example.com', 'Documento ilegible', 'request-1')).resolves.toBe(false);
    expect(sendMail).not.toHaveBeenCalled();
    expect(records[0].snapshot.status.title).toBe('rejected');
  });

  it('conserva los envíos de activación y cuenta activada sin contexto de rechazo', async () => {
    const { sender, sendMail } = build();
    await sender.sendActivationCode('ana@example.com', '123456', new Date(Date.now() + 600_000));
    await sender.sendAccountActivated('ana@example.com', 'Ana');
    expect(sendMail).toHaveBeenCalledTimes(2);
    expect(stringContent(sendMail.mock.calls[0][0].html)).toContain('123456');
    expect(stringContent(sendMail.mock.calls[0][0].text)).toContain('/request-access/activation?email=');
    expect(stringContent(sendMail.mock.calls[1][0].html)).toContain('Hola Ana');
    expect(stringContent(sendMail.mock.calls[1][0].html)).toContain('https://umssy.test/login');
    expect(stringContent(sendMail.mock.calls[0][0].html)).not.toContain('correctionToken');
  });
});
