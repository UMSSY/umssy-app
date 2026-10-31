import { describe, expect, it } from 'vitest';
import { MailTemplateService } from '../../mail/services/mail-template.service.js';
import { loadRejectionTemplate } from '../mail/templates/access-request-mails.template.js';

const VALUES = {
  brandName: 'UMSSY', logoUrl: '', reason: 'Documento ilegible\nSube una imagen con más luz.',
  requestCode: 'SOL-2026-0001',
  requestStatusUrl: `https://umssy.test/request-access/status?code=SOL-2026-0001#correctionToken=dcr1.${'x'.repeat(43)}`,
};

describe('Plantilla de rechazo de B3', () => {
  const templates = new MailTemplateService();

  it('compila el archivo MJML con validación estricta y el marco compartido', async () => {
    const html = await templates.render(await loadRejectionTemplate(), VALUES);
    expect(html).toContain('Necesitamos otro documento');
    expect(html).toContain('Documento ilegible');
    expect(html).toContain('Sube una imagen con más luz.');
    expect(html).toContain(VALUES.requestCode);
    expect(html).toContain(`href="${VALUES.requestStatusUrl}"`);
    expect(html).toContain('Mi solicitud');
    expect(html).toContain('mensaje automático');
    expect(html).toContain('#003770');
    expect(html).not.toContain('<mj-');
    expect(html).not.toContain('{{');
    expect(html).not.toContain('<img');
  });

  it.each([
    '<img src=x onerror=alert(1)>',
    '<script>alert(1)</script>',
    '<mj-include path="/etc/passwd" />',
    '{{ requestStatusUrl }} & "texto"',
  ])('trata el motivo como texto y no como instrucciones: %s', async (reason) => {
    const html = await templates.render(await loadRejectionTemplate(), { ...VALUES, reason });
    expect(html).not.toContain(reason.startsWith('<') ? reason : '& "texto"');
    if (reason.startsWith('<')) expect(html).toContain('&lt;');
    else {
      expect(html).toContain('{{ requestStatusUrl }}');
      expect(html).toContain('&amp;');
    }
    expect(html).toContain(`href="${VALUES.requestStatusUrl}"`);
  });

  it('incluye el logo configurado mediante la cabecera compartida', async () => {
    const html = await templates.render(await loadRejectionTemplate(), { ...VALUES, logoUrl: 'https://umssy.test/logo.svg' });
    expect(html).toContain('https://umssy.test/logo.svg');
  });

  it('requiere el enlace y no inventa un destino alternativo', async () => {
    const { requestStatusUrl: omitted, ...incomplete } = VALUES;
    expect(omitted).toBeTruthy();
    await expect(templates.render(await loadRejectionTemplate(), incomplete)).rejects.toThrow('Missing');
  });
});
