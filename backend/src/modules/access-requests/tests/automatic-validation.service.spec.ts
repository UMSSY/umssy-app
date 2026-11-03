import { Logger } from '@nestjs/common';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Prisma } from '../../../prisma/client.js';
import { AccessRequestNotFoundException, ApprovalNotRevertibleException } from '../exceptions/index.js';
import { AutomaticValidationService } from '../services/automatic-validation.service.js';
import type { DocumentReading } from '../types/document-reading.types.js';

const SOURCE = {
  id: 'req-1',
  requestCode: 'SOL-2026-0141',
  firstName: 'María',
  lastName: 'Quispe Mamani',
  documentFileId: 'file-1',
  career: { title: 'Licenciatura en Ingeniería de Sistemas' },
  documentType: { title: 'academic_diploma' },
  reviewedBy: null,
};

const STATE = {
  ...SOURCE,
  email: 'maria.quispe@gmail.com',
  graduationYear: 2019,
  status: { title: 'pending' },
  documentValidation: { result: 'queued' },
  activationOtps: [] as { id: string }[],
};

const GOOD: DocumentReading = {
  isDiploma: true,
  confidence: 0.98,
  fullName: 'María Quispe Mamani',
  career: 'Licenciatura en Ingeniería de Sistemas',
  graduationYear: 2019,
};

function build(state: Record<string, unknown> = STATE) {
  const tx = {};
  const repository = {
    findAutomationState: vi.fn().mockResolvedValue(state),
    saveEvaluation: vi.fn(async (params: { decide: boolean; result: string }, hook: (source: unknown, client: unknown) => Promise<void>) => {
      await hook(SOURCE, tx);
      return { decided: params.decide && params.result !== 'manual_review', source: SOURCE };
    }),
    revertApproval: vi.fn(async (_id: string, _admin: string, _now: Date, hook: (source: unknown, client: unknown) => Promise<void>) => {
      await hook(SOURCE, tx);
      return SOURCE;
    }),
    countManualReview: vi.fn().mockResolvedValue(5),
    countAutomaticDecisions: vi.fn().mockResolvedValueOnce(12).mockResolvedValueOnce(1),
    countReceivedSince: vi.fn().mockResolvedValue(17),
  };
  const recorder = { record: vi.fn().mockResolvedValue({ id: 'evt' }) };
  const otp = { issueFor: vi.fn().mockResolvedValue(true) };
  const notification = { notify: vi.fn().mockResolvedValue(true) };
  const service = new AutomaticValidationService(repository as any, recorder as any, otp as any, notification as any);
  return { tx, repository, recorder, otp, notification, service };
}

const actions = (recorder: { record: ReturnType<typeof vi.fn> }) => recorder.record.mock.calls.map((call) => call[0].action);

afterEach(() => vi.restoreAllMocks());

describe('AutomaticValidationService.evaluateReading', () => {
  it('CA1 y CA2: aprueba, registra lectura y dictamen en la transacción y luego el código enviado por el Sistema', async () => {
    const { tx, repository, recorder, otp, service } = build();

    const result = await service.evaluateReading('req-1', GOOD, new Date('2026-10-24T15:00:00Z'));

    expect(result).toEqual({ accessRequestId: 'req-1', result: 'auto_approved', matchScore: 98, reason: null, activationCodeSent: true, notificationSent: false });
    expect(repository.saveEvaluation.mock.calls[0][0]).toMatchObject({ accessRequestId: 'req-1', result: 'auto_approved', decide: true });
    expect(actions(recorder)).toEqual(['ocr_read', 'approved', 'activation_code_sent']);
    expect(recorder.record.mock.calls[0][1]).toBe(tx);
    expect(recorder.record.mock.calls[1][1]).toBe(tx);
    expect(recorder.record.mock.calls[1][0].actor).toEqual({ id: null, name: 'Sistema', role: 'sistema' });
    expect(recorder.record.mock.calls[2][0].detail).toBe('Código de activación enviado a ma•••@gmail.com.');
    expect(otp.issueFor).toHaveBeenCalledWith('req-1', 'maria.quispe@gmail.com');
  });

  it('CA2: si el correo no se confirma no registra un envío exitoso', async () => {
    const { recorder, otp, service } = build();
    otp.issueFor.mockResolvedValue(false);

    const result = await service.evaluateReading('req-1', GOOD);

    expect(result.activationCodeSent).toBe(false);
    expect(actions(recorder)).toEqual(['ocr_read', 'approved']);
  });

  it('CA4: rechaza automáticamente, guarda el motivo y avisa al titulado', async () => {
    const { recorder, otp, notification, service } = build();

    const result = await service.evaluateReading('req-1', { ...GOOD, isDiploma: false });

    expect(result).toMatchObject({ result: 'auto_rejected', reason: 'El archivo no es un diploma', notificationSent: true });
    expect(actions(recorder)).toEqual(['ocr_read', 'rejected']);
    expect(notification.notify).toHaveBeenCalledWith('maria.quispe@gmail.com', 'El archivo no es un diploma', 'req-1');
    expect(otp.issueFor).not.toHaveBeenCalled();
  });

  it('CA3: envía a revisión manual sin dictaminar ni enviar correos', async () => {
    const { recorder, otp, notification, service } = build();

    const result = await service.evaluateReading('req-1', { ...GOOD, fullName: 'María Quispe Rojas' });

    expect(result).toMatchObject({ result: 'manual_review', reason: 'El apellido no coincide' });
    expect(actions(recorder)).toEqual(['ocr_read', 'sent_to_manual_review']);
    expect(recorder.record.mock.calls[1][0].detail).toBe('Motivo: El apellido no coincide');
    expect(otp.issueFor).not.toHaveBeenCalled();
    expect(notification.notify).not.toHaveBeenCalled();
  });

  it('si un administrativo ya abrió la solicitud, guarda la lectura como revisión manual sin dictaminar', async () => {
    const { repository, recorder, otp, service } = build({ ...STATE, status: { title: 'in_review' } });

    const result = await service.evaluateReading('req-1', GOOD);

    expect(repository.saveEvaluation.mock.calls[0][0]).toMatchObject({ result: 'manual_review', reason: 'La solicitud ya estaba en revisión manual', decide: false });
    expect(result.result).toBe('manual_review');
    expect(actions(recorder)).toEqual(['ocr_read']);
    expect(otp.issueFor).not.toHaveBeenCalled();
  });

  it('si la solicitud cambió mientras se leía el documento, reintenta guardando sin dictaminar', async () => {
    const { repository, service } = build();
    repository.saveEvaluation.mockRejectedValueOnce(new Prisma.PrismaClientKnownRequestError('cambio', { code: 'P2025', clientVersion: 'test' }));

    const result = await service.evaluateReading('req-1', GOOD);

    expect(repository.saveEvaluation).toHaveBeenCalledTimes(2);
    expect(repository.saveEvaluation.mock.calls[1][0]).toMatchObject({ decide: false, result: 'manual_review' });
    expect(result.activationCodeSent).toBe(false);
  });

  it('no oculta otros errores de la base', async () => {
    const { repository, service } = build();
    const boom = new Error('fallo de base');
    repository.saveEvaluation.mockRejectedValueOnce(boom);
    await expect(service.evaluateReading('req-1', GOOD)).rejects.toBe(boom);
  });

  it('una solicitud sin cola de lectura responde 404', async () => {
    const { service } = build({ ...STATE, documentValidation: null });
    await expect(service.evaluateReading('req-1', GOOD)).rejects.toBeInstanceOf(AccessRequestNotFoundException);
  });

  it('si falla el registro del código enviado, la aprobación no se deshace', async () => {
    const { recorder, service } = build();
    const logError = vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    recorder.record.mockResolvedValueOnce({}).mockResolvedValueOnce({}).mockRejectedValueOnce(new Error('fallo'));

    await expect(service.evaluateReading('req-1', GOOD)).resolves.toMatchObject({ result: 'auto_approved', activationCodeSent: true });
    expect(logError).toHaveBeenCalledOnce();
  });
});

describe('AutomaticValidationService.revertApproval', () => {
  it('CA7 y CA8: devuelve la solicitud a revisión manual y registra la acción con el administrativo', async () => {
    const { tx, repository, recorder, service } = build({ ...STATE, status: { title: 'approved' }, documentValidation: { result: 'auto_approved' } });

    const result = await service.revertApproval('req-1', 'admin-1', new Date('2026-10-24T15:00:00Z'));

    expect(result).toEqual({ id: 'req-1', status: 'in_review', validation: 'manual_review' });
    expect(repository.revertApproval.mock.calls[0].slice(0, 2)).toEqual(['req-1', 'admin-1']);
    expect(recorder.record).toHaveBeenCalledWith(expect.objectContaining({ action: 'approval_reverted', actor: expect.objectContaining({ id: 'admin-1', role: 'administrativo' }) }), tx);
  });

  it('solo revierte aprobaciones automáticas', async () => {
    const { repository, service } = build({ ...STATE, status: { title: 'approved' }, documentValidation: { result: 'manual_review' } });
    await expect(service.revertApproval('req-1', 'admin-1')).rejects.toBeInstanceOf(ApprovalNotRevertibleException);
    expect(repository.revertApproval).not.toHaveBeenCalled();
  });

  it('no revierte si la persona titulada ya activó su cuenta', async () => {
    const { service } = build({ ...STATE, status: { title: 'approved' }, documentValidation: { result: 'auto_approved' }, activationOtps: [{ id: 'otp-1' }] });
    await expect(service.revertApproval('req-1', 'admin-1')).rejects.toThrow('La persona titulada ya activó su cuenta; la aprobación no se puede revertir');
  });

  it('una solicitud inexistente responde 404', async () => {
    const { service } = build(null as never);
    await expect(service.revertApproval('req-x', 'admin-1')).rejects.toBeInstanceOf(AccessRequestNotFoundException);
  });
});

describe('AutomaticValidationService.getSummary', () => {
  it('CA10: cuenta revisión manual, decisiones automáticas de hoy en hora de Bolivia y solicitudes recibidas', async () => {
    const { repository, service } = build();

    await expect(service.getSummary(new Date('2026-10-25T02:00:00Z'))).resolves.toEqual({
      manualReviewCount: 5,
      autoApprovedTodayCount: 12,
      autoRejectedTodayCount: 1,
      receivedTodayCount: 17,
    });
    const todayStart = new Date('2026-10-24T04:00:00.000Z');
    expect(repository.countAutomaticDecisions).toHaveBeenNthCalledWith(1, 'auto_approved', todayStart);
    expect(repository.countAutomaticDecisions).toHaveBeenNthCalledWith(2, 'auto_rejected', todayStart);
    expect(repository.countReceivedSince).toHaveBeenCalledWith(todayStart);
  });
});
