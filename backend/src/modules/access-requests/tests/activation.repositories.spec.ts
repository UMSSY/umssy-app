import { describe, expect, it, vi } from 'vitest';
import { Prisma } from '../../../prisma/client.js';
import { OTP_MAX_ATTEMPTS } from '../constants/otp.constants.js';
import { AccountActivationRepository } from '../repositories/account-activation.repository.js';
import { ActivationOtpRepository } from '../repositories/activation-otp.repository.js';

const NOW = new Date('2026-10-05T12:00:00.000Z');

describe('ActivationOtpRepository', () => {
  function build() {
    const activationOtp = {
      findFirst: vi.fn(),
      update: vi.fn().mockResolvedValue({ attempts: 1 }),
      updateMany: vi.fn().mockResolvedValue({ count: 2 }),
      count: vi.fn(),
      delete: vi.fn().mockResolvedValue({ id: 'otp-1' }),
    };
    return { activationOtp, repository: new ActivationOtpRepository({ activationOtp } as any) };
  }

  it('el código vigente es el último generado', async () => {
    const { activationOtp, repository } = build();

    await repository.findLatestByRequest('req-1');

    expect(activationOtp.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { accessRequestId: 'req-1' }, orderBy: { createdAt: 'desc' } }),
    );
  });

  it('reserva un intento con una sola sentencia condicionada', async () => {
    const { activationOtp, repository } = build();

    await expect(repository.reserveAttempt('otp-1', NOW)).resolves.toEqual({ attempts: 1 });
    expect(activationOtp.update).toHaveBeenCalledWith({
      where: { id: 'otp-1', usedAt: null, expiresAt: { gt: NOW }, attempts: { lt: OTP_MAX_ATTEMPTS } },
      data: { attempts: { increment: 1 } },
      select: { attempts: true },
    });
  });

  it('devuelve null cuando el código ya no admite intentos', async () => {
    const { activationOtp, repository } = build();
    activationOtp.update.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('no existe', { code: 'P2025', clientVersion: 'test' }),
    );

    await expect(repository.reserveAttempt('otp-1', NOW)).resolves.toBeNull();
  });

  it('propaga los errores que no son de intentos agotados', async () => {
    const { activationOtp, repository } = build();
    activationOtp.update.mockRejectedValue(new Error('db caída'));

    await expect(repository.reserveAttempt('otp-1', NOW)).rejects.toThrow('db caída');
  });

  it('devuelve el intento reservado cuando el código era correcto', async () => {
    const { activationOtp, repository } = build();

    await repository.releaseAttempt('otp-1');

    expect(activationOtp.updateMany).toHaveBeenCalledWith({
      where: { id: 'otp-1', attempts: { gt: 0 } },
      data: { attempts: { decrement: 1 } },
    });
  });

  it('invalida un código adelantando su vencimiento a ahora', async () => {
    const { activationOtp, repository } = build();

    await repository.invalidate('otp-1', NOW);

    expect(activationOtp.update).toHaveBeenCalledWith({ where: { id: 'otp-1' }, data: { expiresAt: NOW }, select: { id: true } });
  });

  it('invalida solo los anteriores vigentes y sin usar de la misma solicitud', async () => {
    const { activationOtp, repository } = build();

    await repository.invalidateOthers('req-1', 'otp-2', NOW);

    expect(activationOtp.updateMany).toHaveBeenCalledWith({
      where: { accessRequestId: 'req-1', id: { not: 'otp-2' }, usedAt: null, expiresAt: { gt: NOW } },
      data: { expiresAt: NOW },
    });
  });

  it('no cuenta como reenvío el primer código de la solicitud', async () => {
    const { activationOtp, repository } = build();
    activationOtp.findFirst.mockResolvedValue({ id: 'otp-first' });
    activationOtp.count.mockResolvedValue(2);
    const since = new Date('2026-10-05T11:00:00.000Z');

    await expect(repository.countResendsSince('req-1', since)).resolves.toBe(2);
    expect(activationOtp.count).toHaveBeenCalledWith({
      where: { accessRequestId: 'req-1', id: { not: 'otp-first' }, createdAt: { gte: since } },
    });
  });

  it('sin códigos emitidos hay 0 reenvíos y no consulta el conteo', async () => {
    const { activationOtp, repository } = build();
    activationOtp.findFirst.mockResolvedValue(null);

    await expect(repository.countResendsSince('req-1', NOW)).resolves.toBe(0);
    expect(activationOtp.count).not.toHaveBeenCalled();
  });

  it('descarta un código por su id', async () => {
    const { activationOtp, repository } = build();

    await repository.remove('otp-1');

    expect(activationOtp.delete).toHaveBeenCalledWith({ where: { id: 'otp-1' }, select: { id: true } });
  });
});

describe('AccountActivationRepository', () => {
  const USER = { accessRequestId: 'req-1', firstName: 'Ana', lastName: 'Pérez', email: 'ana@umss.test', phone: '71234567', passwordHash: '$2b$hash' };

  function build(consumed = 1) {
    const tx = {
      activationOtp: { updateMany: vi.fn().mockResolvedValue({ count: consumed }) },
      user: { create: vi.fn().mockResolvedValue({ id: 'user-1' }) },
      accessRequest: { update: vi.fn().mockResolvedValue({ id: 'req-1' }) },
    };
    const prisma = {
      accessRequest: { findFirst: vi.fn() },
      user: { findFirst: vi.fn() },
      $transaction: vi.fn(async (callback: (client: typeof tx) => unknown) => callback(tx)),
    };
    return { tx, prisma, repository: new AccountActivationRepository(prisma as any) };
  }

  it('busca la última solicitud aprobada del correo', async () => {
    const { prisma, repository } = build();

    await repository.findApprovedRequestByEmail('ana@umss.test');

    expect(prisma.accessRequest.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { email: 'ana@umss.test', status: { title: 'approved' } },
        orderBy: { reviewedAt: { sort: 'desc', nulls: 'last' } },
      }),
    );
  });

  it.each([
    [{ id: 'user-1' }, true],
    [null, false],
  ])('detecta si ya existe un usuario con el correo (%o)', async (found, expected) => {
    const { prisma, repository } = build();
    prisma.user.findFirst.mockResolvedValue(found);

    await expect(repository.userExistsByEmail('ana@umss.test')).resolves.toBe(expected);
    expect(prisma.user.findFirst).toHaveBeenCalledWith({
      where: { email: { equals: 'ana@umss.test', mode: 'insensitive' } },
      select: { id: true },
    });
  });

  it('consume el código y crea el usuario titulado en una sola transacción', async () => {
    const { tx, prisma, repository } = build();

    await expect(repository.createUserAndConsumeOtp('otp-1', USER, NOW)).resolves.toBe('created');

    expect(prisma.$transaction).toHaveBeenCalledOnce();
    expect(tx.activationOtp.updateMany).toHaveBeenCalledWith({ where: { id: 'otp-1', usedAt: null }, data: { usedAt: NOW } });
    expect(tx.accessRequest.update).toHaveBeenCalledWith({
      where: { id: 'req-1' },
      data: { approvedUserId: 'user-1' },
    });
    expect(tx.user.create).toHaveBeenCalledWith({
      data: {
        firstName: 'Ana',
        lastName: 'Pérez',
        email: 'ana@umss.test',
        phone: '71234567',
        password: '$2b$hash',
        isActive: true,
        roles: { create: { role: { connect: { name: 'titulado' } } } },
      },
      select: { id: true },
    });
  });

  it('si el código ya estaba usado no crea el usuario', async () => {
    const { tx, repository } = build(0);

    await expect(repository.createUserAndConsumeOtp('otp-1', USER, NOW)).resolves.toBe('already_used');
    expect(tx.user.create).not.toHaveBeenCalled();
    expect(tx.accessRequest.update).not.toHaveBeenCalled();
  });

  it('si el correo ya tiene usuario (violación de unicidad) responde already_used', async () => {
    const { prisma, repository } = build();
    prisma.$transaction.mockRejectedValue(new Prisma.PrismaClientKnownRequestError('duplicado', { code: 'P2002', clientVersion: 'test' }));

    await expect(repository.createUserAndConsumeOtp('otp-1', USER, NOW)).resolves.toBe('already_used');
  });

  it('propaga cualquier otro error de la base', async () => {
    const { prisma, repository } = build();
    prisma.$transaction.mockRejectedValue(new Error('base caída'));

    await expect(repository.createUserAndConsumeOtp('otp-1', USER, NOW)).rejects.toThrow('base caída');
  });
  it('propaga el fallo al vincular la solicitud para revertir la transacción', async () => {
    const { tx, repository } = build();
    tx.accessRequest.update.mockRejectedValue(new Error('fallo al vincular'));
    await expect(repository.createUserAndConsumeOtp('otp-1', USER, NOW)).rejects.toThrow('fallo al vincular');
  });

});
