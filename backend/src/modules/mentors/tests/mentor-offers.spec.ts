import { afterEach, describe, expect, it, vi } from 'vitest';
import { GUARDS_METADATA } from '@nestjs/common/constants.js';
import { Logger } from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import type { PrismaService } from '../../../common/prisma/prisma.service.js';
import { MentorOffersController } from '../controllers/mentor-offers.controller.js';
import { MentorOffersRepository } from '../repositories/mentor-offers.repository.js';
import { MentorOffersService } from '../services/mentor-offers.service.js';
import { MentorOffersWorker } from '../services/mentor-offers-worker.service.js';

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); vi.useRealTimers(); });

function fixture(options: { status?: string; requestStatus?: string; claimed?: number; missing?: boolean; eligible?: boolean; reservedOffers?: number } = {}) {
  const createRole = vi.fn();
  const execute = vi.fn(async (strings: TemplateStringsArray) =>
    strings.join(' ').includes("SET status = 'CONFIRMED'") ? (options.claimed ?? 1) : 0);
  const tx = {
    $executeRaw: execute,
    $queryRaw: vi.fn(async (strings: TemplateStringsArray) => {
      const sql = strings.join(' ');
      if (sql.includes('pg_advisory_xact_lock')) return [];
      if (sql.includes('AS "approvedGraduates"')) return [{ approvedGraduates: 3, activeMentors: 0, reservedOffers: options.reservedOffers ?? 1 }];
      if (sql.includes('AS eligible')) return [{ eligible: options.eligible ?? true, alreadyMentor: false }];
      return options.missing ? [] : [{ requestId: 'request-1', status: options.status ?? 'OFFERED',
        requestStatus: options.requestStatus ?? 'OFFERED', technicalAreaIds: ['area-1'], orientationTypeIds: ['orientation-1'] }];
    }),
    technicalArea: { count: vi.fn().mockResolvedValue(1) },
    orientationType: { count: vi.fn().mockResolvedValue(1) },
    role: { findUnique: vi.fn().mockResolvedValue({ id: 'mentor-role' }) },
    userRole: { create: createRole },
    mentorTechnicalArea: { deleteMany: vi.fn(), createMany: vi.fn() },
    mentorOrientationType: { deleteMany: vi.fn(), createMany: vi.fn() },
    user: { update: vi.fn() },
  };
  const transaction = vi.fn(async (operation) => operation(tx));
  const repository = new MentorOffersRepository({ $transaction: transaction } as unknown as PrismaService);
  return { service: new MentorOffersService(repository), tx, execute, createRole, transaction };
}

describe('confirmación HU-7-3', () => {
  it('solo ejecuta una asignación si queda un cupo real después de vencer las ofertas', async () => {
    const full = fixture();
    await full.service.reconcile();
    expect(full.execute).toHaveBeenCalledTimes(2); // Zona horaria y vencimiento.
    const available = fixture({ reservedOffers: 0 });
    await available.service.reconcile();
    expect(available.execute).toHaveBeenCalledTimes(3); // Incluye la asignación FIFO.
  });

  it('confirma una sola participación y restaura sus preferencias', async () => {
    const { service, createRole, tx } = fixture();
    await expect(service.confirm('user-1', 'offer-1')).resolves.toMatchObject({ status: 'ACTIVE', alreadyConfirmed: false });
    expect(createRole).toHaveBeenCalledOnce();
    expect(tx.mentorTechnicalArea.createMany).toHaveBeenCalledWith({ data: [{ mentorId: 'user-1', technicalAreaId: 'area-1' }] });
    expect(tx.user.update).toHaveBeenCalledWith({ where: { id: 'user-1' }, data: { isAvailableForMentoring: true } });
  });

  it('repetir una confirmación no vuelve a crear el rol', async () => {
    const { service, createRole } = fixture({ status: 'CONFIRMED', requestStatus: 'ACTIVE' });
    await expect(service.confirm('user-1', 'offer-1')).resolves.toMatchObject({ alreadyConfirmed: true });
    expect(createRole).not.toHaveBeenCalled();
  });

  it.each([{ status: 'EXPIRED', requestStatus: 'EXPIRED' }, { claimed: 0 }])('rechaza el vencimiento sin activar ni revertir su reconciliación', async (options) => {
    const { service, createRole, transaction } = fixture(options);
    await expect(service.confirm('user-1', 'offer-1')).rejects.toMatchObject({ statusCode: 409 });
    expect(createRole).not.toHaveBeenCalled();
    await expect(transaction.mock.results[0].value).resolves.toEqual({ expired: true });
  });

  it('no revela ofertas ajenas y vuelve a validar la elegibilidad', async () => {
    await expect(fixture({ missing: true }).service.confirm('other-user', 'offer-1')).rejects.toMatchObject({ statusCode: 404 });
    const { service, createRole } = fixture({ eligible: false });
    await expect(service.confirm('user-1', 'offer-1')).rejects.toMatchObject({ statusCode: 403 });
    expect(createRole).not.toHaveBeenCalled();
  });

  it('propaga el fallo de escritura para revertir la transacción completa', async () => {
    const { service, createRole } = fixture();
    createRole.mockRejectedValueOnce(new Error('write failed'));
    await expect(service.confirm('user-1', 'offer-1')).rejects.toThrow('write failed');
  });

  it('usa la identidad del JWT y protege la ruta de confirmación', async () => {
    const confirm = vi.fn().mockResolvedValue({ status: 'ACTIVE' });
    const controller = new MentorOffersController({ confirm } as unknown as MentorOffersService);
    expect(Reflect.getMetadata(GUARDS_METADATA, MentorOffersController)).toEqual([JwtAuthGuard]);
    await controller.confirm({ id: 'jwt-user' } as never, 'offer-1');
    expect(confirm).toHaveBeenCalledWith('jwt-user', 'offer-1');
  });
});

describe('proceso programado de ofertas', () => {
  it('reconcilia al iniciar, cada 15 segundos y se detiene al cerrar el módulo', async () => {
    vi.useFakeTimers(); vi.stubEnv('NODE_ENV', 'development');
    const reconcile = vi.fn().mockResolvedValue(undefined);
    const worker = new MentorOffersWorker({ reconcile } as unknown as MentorOffersService);
    worker.onModuleInit();
    await vi.advanceTimersByTimeAsync(30_000);
    expect(reconcile).toHaveBeenCalledTimes(3);
    worker.onModuleDestroy();
    await vi.advanceTimersByTimeAsync(30_000);
    expect(reconcile).toHaveBeenCalledTimes(3);
  });

  it('no superpone ejecuciones y vuelve a intentar después de un fallo', async () => {
    let release!: () => void;
    const reconcile = vi.fn().mockImplementationOnce(() => new Promise<void>((resolve) => { release = resolve; }))
      .mockRejectedValueOnce(new Error('database unavailable')).mockResolvedValue(undefined);
    vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    const worker = new MentorOffersWorker({ reconcile } as unknown as MentorOffersService);
    const first = worker.tick();
    await worker.tick();
    expect(reconcile).toHaveBeenCalledOnce();
    release(); await first; await worker.tick(); await worker.tick();
    expect(reconcile).toHaveBeenCalledTimes(3);
  });
});
