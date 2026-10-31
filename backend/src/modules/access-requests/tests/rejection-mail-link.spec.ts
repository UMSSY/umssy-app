import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RejectionMailContextService } from '../mail/rejection-mail-context.service.js';
import { RejectionMailRepository } from '../repositories/rejection-mail.repository.js';
import { DocumentCorrectionAuthorizationService } from '../services/document-correction-authorization.service.js';
import { RejectionMailLinkService } from '../services/rejection-mail-link.service.js';
import { correctionContext } from './document-correction.fixture.js';

const REASON = 'Documento ilegible';
const RECIPIENT = 'ana@example.com';
const GRANT = { requestCode: 'SOL-2026-0139', token: `dcr1.${'x'.repeat(43)}` };
const REVISION = new Date('2026-10-28T12:00:00.000Z');

function build() {
  const context = new RejectionMailContextService();
  const repository = { findById: vi.fn<RejectionMailRepository['findById']>().mockResolvedValue({
    email: RECIPIENT, rejectionReason: REASON, updatedAt: REVISION,
  }) };
  const authorization = {
    issueFor: vi.fn<DocumentCorrectionAuthorizationService['issueFor']>().mockResolvedValue(GRANT),
    authorize: vi.fn<DocumentCorrectionAuthorizationService['authorize']>().mockResolvedValue(correctionContext()),
  };
  const service = new RejectionMailLinkService(context,
    repository as unknown as RejectionMailRepository,
    authorization as unknown as DocumentCorrectionAuthorizationService);
  const execute = (to = RECIPIENT, reason = REASON) => context.run('request-1', () => service.forRecipient(to, reason));
  return { service, repository, authorization, execute };
}

beforeEach(() => vi.stubEnv('FRONTEND_URL', 'https://umssy.test'));
afterEach(() => vi.unstubAllEnvs());

describe('RejectionMailLinkService', () => {
  it('usa el ID del rechazo y comprueba la revisión del permiso emitido por B2', async () => {
    const { repository, authorization, execute } = build();
    const result = await execute(' ANA@EXAMPLE.COM ');
    expect(repository.findById).toHaveBeenCalledWith('request-1');
    expect(authorization.issueFor).toHaveBeenCalledWith('request-1');
    expect(authorization.authorize).toHaveBeenCalledWith(GRANT.requestCode, `Bearer ${GRANT.token}`);
    expect(result.requestCode).toBe(GRANT.requestCode);
    expect(new URL(result.url).searchParams.get('code')).toBe(GRANT.requestCode);
  });

  it('rechaza llamadas sin contexto y no busca solicitudes por correo', async () => {
    const { service, repository, authorization } = build();
    await expect(service.forRecipient(RECIPIENT, REASON)).rejects.toThrow('No se pudo preparar');
    expect(repository.findById).not.toHaveBeenCalled();
    expect(authorization.issueFor).not.toHaveBeenCalled();
  });

  it('no prepara un correo sin motivo', async () => {
    const { execute, repository } = build();
    await expect(execute(RECIPIENT, '  ')).rejects.toThrow();
    expect(repository.findById).not.toHaveBeenCalled();
  });

  it.each([
    null,
    { email: 'otra@example.com', rejectionReason: REASON, updatedAt: REVISION },
    { email: RECIPIENT, rejectionReason: 'Otra revisión', updatedAt: REVISION },
    { email: RECIPIENT, rejectionReason: null, updatedAt: REVISION },
    { email: RECIPIENT, rejectionReason: REASON, updatedAt: new Date('invalid') },
  ])('no emite un permiso con datos incompatibles: %j', async (source) => {
    const { execute, repository, authorization } = build();
    repository.findById.mockResolvedValue(source);
    await expect(execute()).rejects.toThrow();
    expect(authorization.issueFor).not.toHaveBeenCalled();
  });

  it('propaga el rechazo de B2 cuando el estado ya cambió', async () => {
    const { execute, authorization } = build();
    authorization.issueFor.mockRejectedValue(new Error('Estado cambiado'));
    await expect(execute()).rejects.toThrow('Estado cambiado');
    expect(authorization.authorize).not.toHaveBeenCalled();
  });

  it('no entrega un enlace si B2 rechaza la revisión al verificarla', async () => {
    const { execute, authorization } = build();
    authorization.authorize.mockRejectedValue(new Error('Revisión cambiada'));
    await expect(execute()).rejects.toThrow('Revisión cambiada');
  });

  it.each([
    { accessRequestId: 'otra-solicitud' },
    { requestCode: 'SOL-2026-9999' },
    { revision: new Date('2026-10-28T12:01:00.000Z') },
  ])('rechaza un permiso de otra solicitud o revisión: %j', async (overrides) => {
    const { execute, authorization } = build();
    authorization.authorize.mockResolvedValue(correctionContext(overrides));
    await expect(execute()).rejects.toThrow('No se pudo preparar');
  });

  it('propaga errores de lectura sin fabricar un enlace alternativo', async () => {
    const { execute, repository, authorization } = build();
    repository.findById.mockRejectedValue(new Error('Base no disponible'));
    await expect(execute()).rejects.toThrow('Base no disponible');
    expect(authorization.issueFor).not.toHaveBeenCalled();
  });
});
