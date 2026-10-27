import 'reflect-metadata';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GUARDS_METADATA, INTERCEPTORS_METADATA, PATH_METADATA } from '@nestjs/common/constants.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { ResponseInterceptor } from '../../../common/interceptors/index.js';
import type { AuthenticatedUser } from '../../../common/types/authenticated-user.types.js';
import type { PrismaService } from '../../../common/prisma/prisma.service.js';
import { MentorExitController } from '../controllers/mentor-exit.controller.js';
import { MentorExitRepository } from '../repositories/mentor-exit.repository.js';
import { MentorExitService } from '../services/mentor-exit.service.js';
import { reconcileMentorOffers } from '../repositories/mentor-offers.queries.js';

vi.mock('../repositories/mentor-offers.queries.js', () => ({ reconcileMentorOffers: vi.fn() }));

describe('desactivación de participación HU6', () => {
  beforeEach(() => vi.clearAllMocks());

  it('exige JWT y utiliza exclusivamente el usuario autenticado', async () => {
    const service = { leave: vi.fn().mockResolvedValue({ id: 'authenticated-user', status: 'ENDED', alreadyEnded: false }) };
    const controller = new MentorExitController(service as unknown as MentorExitService);
    expect(Reflect.getMetadata(GUARDS_METADATA, MentorExitController)).toContain(JwtAuthGuard);
    expect(Reflect.getMetadata(INTERCEPTORS_METADATA, MentorExitController)).toContain(ResponseInterceptor);
    expect(Reflect.getMetadata(PATH_METADATA, MentorExitController)).toBe('mentors/me');
    expect(Reflect.getMetadata(PATH_METADATA, Object.getOwnPropertyDescriptor(MentorExitController.prototype, 'leave')?.value)).toBe('leave');
    await expect(controller.leave({ id: 'authenticated-user' } as AuthenticatedUser))
      .resolves.toEqual({ id: 'authenticated-user', status: 'ENDED', alreadyEnded: false });
    expect(service.leave).toHaveBeenCalledWith('authenticated-user');
  });

  it('propaga una falla de persistencia y no ejecuta la reasignación después del error', async () => {
    const failure = new Error('No se pudo actualizar la disponibilidad');
    const query = vi.fn(async (strings: TemplateStringsArray) =>
      strings.join(' ').includes('AS "hasFutureAppointments"') ? [{ hasFutureAppointments: false }] : [{ id: 'role' }]);
    const update = vi.fn().mockRejectedValue(failure);
    const tx = { $executeRaw: vi.fn(), $queryRaw: query, user: { update } };
    const transaction = vi.fn(async (operation: (value: typeof tx) => Promise<unknown>) => operation(tx));
    const repository = new MentorExitRepository({ $transaction: transaction } as unknown as PrismaService);
    await expect(new MentorExitService(repository).leave('user')).rejects.toBe(failure);
    expect(reconcileMentorOffers).not.toHaveBeenCalled();
    expect(transaction).toHaveBeenCalledWith(expect.any(Function), expect.objectContaining({ isolationLevel: 'ReadCommitted' }));
  });

  it('revoca el rol, termina la solicitud y conserva ambas preferencias', async () => {
    const query = vi.fn(async (strings: TemplateStringsArray) =>
      strings.join(' ').includes('AS "hasFutureAppointments"') ? [{ hasFutureAppointments: false }] : [{ id: 'role' }]);
    const execute = vi.fn().mockResolvedValue(1);
    const tx = { $queryRaw: query, $executeRaw: execute,
      user: { update: vi.fn().mockResolvedValue({ id: 'user' }) },
      mentorTechnicalArea: { deleteMany: vi.fn() },
      mentorOrientationType: { deleteMany: vi.fn() },
    };
    const prisma = { $transaction: vi.fn(async (operation: (value: typeof tx) => Promise<unknown>) => operation(tx)) };
    const repository = new MentorExitRepository(prisma as unknown as PrismaService);

    expect(await new MentorExitService(repository).leave('user')).toEqual({ id: 'user', status: 'ENDED', alreadyEnded: false });
    expect(execute.mock.calls.some(([strings]) => strings.join(' ').includes('UPDATE user_roles'))).toBe(true);
    expect(execute.mock.calls.some(([strings]) => strings.join(' ').includes('status = \'ENDED\''))).toBe(true);
    expect(tx.user.update).toHaveBeenCalledWith({ where: { id: 'user' }, data: { isAvailableForMentoring: false } });
    expect(tx.mentorTechnicalArea.deleteMany).not.toHaveBeenCalled();
    expect(tx.mentorOrientationType.deleteMany).not.toHaveBeenCalled();
    expect(reconcileMentorOffers).toHaveBeenCalledExactlyOnceWith(tx);
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    const statements = execute.mock.calls.map(([strings]) => strings.join(' '));
    expect(statements[1]).toContain('LOCK TABLE appointments IN SHARE MODE');
    expect(statements[2]).toContain('UPDATE user_roles');
    expect(query.mock.calls[1][0].join(' ')).toContain('FOR UPDATE OF ur');
    expect(execute.mock.invocationCallOrder[1]).toBeLessThan(query.mock.invocationCallOrder[2]);
    expect(query.mock.invocationCallOrder[2]).toBeLessThan(execute.mock.invocationCallOrder[2]);
  });

  it('no altera el cupo ni las preferencias cuando ya salió', async () => {
    const tx = { $queryRaw: vi.fn().mockResolvedValue([]), $executeRaw: vi.fn(), user: { update: vi.fn() } };
    const repository = new MentorExitRepository({
      $transaction: async (operation: (value: typeof tx) => Promise<unknown>) => operation(tx),
    } as unknown as PrismaService);
    expect(await new MentorExitService(repository).leave('user')).toEqual({ id: 'user', status: 'ENDED', alreadyEnded: true });
    expect(tx.user.update).not.toHaveBeenCalled();
    expect(tx.$executeRaw).toHaveBeenCalledTimes(1);
    expect(reconcileMentorOffers).not.toHaveBeenCalled();
  });

  it('mantiene el rol y el cupo si existen citas futuras', async () => {
    const tx = {
      $queryRaw: vi.fn(async (strings: TemplateStringsArray) =>
        strings.join(' ').includes('AS "hasFutureAppointments"') ? [{ hasFutureAppointments: true }] : [{ id: 'role' }]),
      $executeRaw: vi.fn(), user: { update: vi.fn() },
    };
    const repository = new MentorExitRepository({
      $transaction: async (operation: (value: typeof tx) => Promise<unknown>) => operation(tx),
    } as unknown as PrismaService);
    await expect(new MentorExitService(repository).leave('user')).rejects.toMatchObject({
      statusCode: 409,
      data: { code: 'MENTOR_HAS_FUTURE_APPOINTMENTS', agendaPath: '/mentor/availability' },
    });
    expect(tx.$executeRaw.mock.calls.some(([strings]) => strings.join(' ').includes('UPDATE user_roles'))).toBe(false);
    expect(tx.user.update).not.toHaveBeenCalled();
    expect(reconcileMentorOffers).not.toHaveBeenCalled();
  });

  it('propaga el fallo final dentro de la misma transacción', async () => {
    const failure = new Error('Falló la última escritura');
    vi.mocked(reconcileMentorOffers).mockRejectedValueOnce(failure);
    const tx = {
      $queryRaw: vi.fn(async (strings: TemplateStringsArray) =>
        strings.join(' ').includes('AS "hasFutureAppointments"') ? [{ hasFutureAppointments: false }] : [{ id: 'role' }]),
      $executeRaw: vi.fn(),
      user: { update: vi.fn() },
    };
    const transaction = vi.fn(async (operation: (value: typeof tx) => Promise<unknown>) => operation(tx));
    const repository = new MentorExitRepository({ $transaction: transaction } as unknown as PrismaService);

    await expect(new MentorExitService(repository).leave('user')).rejects.toBe(failure);
    await expect(transaction.mock.results[0].value).rejects.toBe(failure);
    expect(reconcileMentorOffers).toHaveBeenCalledExactlyOnceWith(tx);
    expect(transaction).toHaveBeenCalledTimes(1);
  });
});
