import { Logger } from '@nestjs/common';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Prisma } from '../../../prisma/client.js';
import { maskEmail } from '../helpers/mask-email.js';
import {
  toActivationCodeSentAuditEvent,
  toApprovedAuditEvent,
  toOpenedAuditEvent,
  toRejectedAuditEvent,
  toSubmittedAuditEvent,
} from '../mappers/access-request-audit-event.mapper.js';
import { AccessRequestsRepository } from '../repositories/access-requests.repository.js';
import { AccessRequestsService } from '../services/access-requests.service.js';
import type { AccessRequestAuditSource } from '../types/access-request-audit.types.js';

const SOURCE: AccessRequestAuditSource = {
  id: 'req-1',
  requestCode: 'SOL-2026-0141',
  firstName: 'Andrea',
  lastName: 'Camacho Torrez',
  documentFileId: 'file-1',
  career: { title: 'Licenciatura en Ingeniería de Sistemas' },
  documentType: { title: 'academic_diploma' },
  reviewedBy: { firstName: 'Carla', lastName: 'Montaño' },
};

const prismaError = (code: string) => new Prisma.PrismaClientKnownRequestError('error', { code, clientVersion: 'test' });

afterEach(() => vi.restoreAllMocks());

describe('maskEmail', () => {
  it('deja ver solo dos caracteres del usuario y el dominio', () => {
    expect(maskEmail('andrea.ct@gmail.com')).toBe('an•••@gmail.com');
    expect(maskEmail('sin-arroba')).toBe('•••');
  });
});

describe('eventos de auditoría de la solicitud', () => {
  it('el envío lo hace la persona titulada y conserva el documento adjunto', () => {
    expect(toSubmittedAuditEvent(SOURCE)).toEqual({
      accessRequestId: 'req-1',
      requestCode: 'SOL-2026-0141',
      applicantName: 'Andrea Camacho Torrez',
      applicantCareer: 'Licenciatura en Ingeniería de Sistemas',
      evidenceFileId: 'file-1',
      action: 'submitted',
      actor: { id: null, name: 'Andrea Camacho Torrez', role: 'titulado' },
      detail: 'Solicitud enviada con diploma académico adjunto.',
    });
  });

  it('la apertura, la aprobación y el rechazo se atribuyen al administrativo autenticado', () => {
    const actor = { id: 'admin-1', name: 'Carla Montaño', role: 'administrativo' };
    expect(toOpenedAuditEvent(SOURCE, 'admin-1')).toMatchObject({ action: 'opened', actor });
    expect(toApprovedAuditEvent(SOURCE, 'admin-1')).toMatchObject({ action: 'approved', actor, detail: 'Documento revisado: Diploma académico.', evidenceFileId: 'file-1' });
    expect(toRejectedAuditEvent(SOURCE, 'admin-1', 'Documento ilegible')).toMatchObject({ action: 'rejected', actor, detail: 'Motivo: Documento ilegible' });
  });

  it('sin datos del revisor ni tipo de documento usa un nombre genérico y no inventa detalle', () => {
    const source = { ...SOURCE, reviewedBy: null, documentType: null, requestCode: null };
    expect(toApprovedAuditEvent(source, 'admin-1')).toMatchObject({ requestCode: '', detail: null, actor: { name: 'Personal administrativo' } });
    expect(toSubmittedAuditEvent(source).detail).toBeNull();
  });

  it('el código enviado lo registra el Sistema, sin documento, con el correo enmascarado y sin el código', () => {
    const event = toActivationCodeSentAuditEvent(SOURCE, 'andrea.ct@gmail.com');
    expect(event).toMatchObject({ action: 'activation_code_sent', actor: { id: null, name: 'Sistema', role: 'sistema' }, evidenceFileId: null });
    expect(event.detail).toBe('Código de activación enviado a an•••@gmail.com.');
  });
});

describe('AccessRequestsRepository: dictamen y evento en una sola transacción', () => {
  const build = () => {
    const tx = { accessRequest: { update: vi.fn().mockResolvedValue(SOURCE), updateMany: vi.fn().mockResolvedValue({ count: 1 }) } };
    const prisma = { $transaction: vi.fn((operation: (client: unknown) => unknown) => operation(tx)), accessRequest: { update: vi.fn() } };
    return { tx, prisma, repository: new AccessRequestsRepository(prisma as any) };
  };

  it('setVerdict con evento abre una transacción y entrega al registro el cliente de esa transacción', async () => {
    const { tx, prisma, repository } = build();
    const onApplied = vi.fn().mockResolvedValue(undefined);

    await expect(repository.setVerdict('req-1', 'admin-1', { status: 'approved' }, onApplied)).resolves.toBe(true);

    expect(prisma.$transaction).toHaveBeenCalledOnce();
    expect(prisma.accessRequest.update).not.toHaveBeenCalled();
    expect(onApplied).toHaveBeenCalledWith(SOURCE, tx);
  });

  it('si el evento no se guarda, el error sale de la transacción y el dictamen no queda confirmado', async () => {
    const { repository } = build();
    const boom = new Error('no se pudo guardar el evento');
    await expect(repository.setVerdict('req-1', 'admin-1', { status: 'approved' }, vi.fn().mockRejectedValue(boom))).rejects.toBe(boom);
  });

  it('una solicitud que ya no está en revisión no genera evento', async () => {
    const { tx, repository } = build();
    const onApplied = vi.fn();
    tx.accessRequest.update.mockRejectedValue(prismaError('P2025'));

    await expect(repository.setVerdict('req-1', 'admin-1', { status: 'approved' }, onApplied)).resolves.toBe(false);
    expect(onApplied).not.toHaveBeenCalled();
  });

  it('markInReview registra la apertura dentro de la misma transacción', async () => {
    const { tx, repository } = build();
    const onOpened = vi.fn().mockResolvedValue(undefined);

    await expect(repository.markInReview('req-1', 'admin-1', onOpened)).resolves.toBe(true);
    expect(onOpened).toHaveBeenCalledWith(SOURCE, tx);
  });

  it('submit con evento usa una transacción y devuelve solo los datos del envío', async () => {
    const { tx, repository } = build();
    tx.accessRequest.update.mockResolvedValue({ ...SOURCE, submittedAt: new Date('2026-09-21T13:20:00Z'), status: { title: 'pending' } });
    const onSubmitted = vi.fn().mockResolvedValue(undefined);

    const result = await repository.submit('req-1', 'SOL-2026-0141', onSubmitted);

    expect(onSubmitted).toHaveBeenCalledOnce();
    expect(result).toEqual({ id: 'req-1', requestCode: 'SOL-2026-0141', submittedAt: new Date('2026-09-21T13:20:00Z'), status: { title: 'pending' } });
  });
});

describe('AccessRequestsService: registro de auditoría', () => {
  const DETAIL = { ...SOURCE, email: 'andrea.ct@gmail.com', status: { title: 'in_review' } };

  const build = () => {
    const tx = {};
    const repository = {
      findDetailById: vi.fn().mockResolvedValue(DETAIL),
      setVerdict: vi.fn(async (_id: string, _reviewer: string, _verdict: unknown, hook: (source: unknown, client: unknown) => Promise<unknown>) => {
        await hook(SOURCE, tx);
        return true;
      }),
    };
    const otp = { issueFor: vi.fn().mockResolvedValue(true) };
    const notification = { notify: vi.fn().mockResolvedValue(true) };
    const recorder = { record: vi.fn().mockResolvedValue({ id: 'evt-1' }) };
    const service = new AccessRequestsService(repository as any, {} as any, {} as any, otp as any, notification as any, recorder as any);
    return { tx, repository, otp, recorder, service };
  };

  it('aprobar registra el dictamen en la transacción y después el código enviado como Sistema', async () => {
    const { tx, recorder, service } = build();

    await expect(service.approve('req-1', 'admin-1')).resolves.toEqual({ id: 'req-1', status: 'approved', activationCodeSent: true });

    expect(recorder.record).toHaveBeenNthCalledWith(1, expect.objectContaining({ action: 'approved', actor: expect.objectContaining({ id: 'admin-1' }) }), tx);
    expect(recorder.record).toHaveBeenNthCalledWith(2, expect.objectContaining({ action: 'activation_code_sent' }));
  });

  it('si el correo no se confirma no registra un envío exitoso', async () => {
    const { otp, recorder, service } = build();
    otp.issueFor.mockResolvedValue(false);

    await service.approve('req-1', 'admin-1');

    expect(recorder.record).toHaveBeenCalledOnce();
    expect(recorder.record.mock.calls[0][0].action).toBe('approved');
  });

  it('si falla el registro del código enviado, la aprobación ya confirmada no se deshace', async () => {
    const { recorder, service } = build();
    const logError = vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    recorder.record.mockResolvedValueOnce({ id: 'evt-1' }).mockRejectedValueOnce(new Error('fallo'));

    await expect(service.approve('req-1', 'admin-1')).resolves.toMatchObject({ status: 'approved' });
    expect(logError).toHaveBeenCalledOnce();
  });

  it('rechazar registra el motivo realmente guardado', async () => {
    const { tx, recorder, service } = build();

    await service.reject('req-1', 'admin-1', 'El nombre no coincide');

    expect(recorder.record).toHaveBeenCalledWith(expect.objectContaining({ action: 'rejected', detail: 'Motivo: El nombre no coincide' }), tx);
  });
});
