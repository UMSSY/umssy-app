import { randomUUID } from 'node:crypto';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import * as bcrypt from 'bcrypt';
import type { JwtService } from '@nestjs/jwt';
import type { MailService } from '../src/modules/mail/services/mail.service.js';
import { PrismaService } from '../src/common/prisma/prisma.service.js';
import { buildDatabaseConnectionString } from '../src/common/prisma/build-connection-string.js';
import { PASSWORD_HISTORY_LIMIT } from '../src/modules/auth/constants/password-history.constants.js';
import { PasswordReusedException } from '../src/modules/auth/exceptions/password-reused.exception.js';
import { PasswordResetConflictException } from '../src/modules/auth/exceptions/password-reset-conflict.exception.js';
import { AuthRepository } from '../src/modules/auth/repositories/auth.repository.js';
import { PasswordHistoryRepository } from '../src/modules/auth/repositories/password-history.repository.js';
import { AuthService } from '../src/modules/auth/services/auth.service.js';
import { PasswordHistoryService } from '../src/modules/auth/services/password-history.service.js';
import type { RefreshTokenService } from '../src/modules/auth/services/refresh-token.service.js';

describe.skipIf(process.env.RUN_HU17_DB_TESTS !== '1')('Historial y recuperación con PostgreSQL aislado', () => {
  let prisma: PrismaService | undefined;
  let repository: AuthRepository;
  let history: PasswordHistoryRepository;
  let historyService: PasswordHistoryService;
  let service: AuthService;
  let userId = '';
  let otpId = '';
  let originalHash = '';
  let fixtureIds: string[] = [];
  const refresh = { revokeAllForUser: vi.fn() };

  function state() {
    if (!prisma || !userId) throw new Error('No se inicializó el usuario de prueba.');
    return { prisma, userId };
  }

  async function createUser(password: string | null) {
    if (!prisma) throw new Error('No se inicializó PostgreSQL.');
    const id = randomUUID();
    fixtureIds.push(id);
    await prisma.user.create({ data: {
      id, firstName: 'Prueba', lastName: 'Historial',
      email: `hu17-history-${id}@example.test`, password,
    } });
    return id;
  }

  async function issueCode(code = '123456') {
    const { userId: currentUser } = state();
    return repository.createPasswordResetOtp(currentUser, await bcrypt.hash(code, 4), new Date(Date.now() + 300_000));
  }

  async function reset(password: string, code = '123456') {
    const { userId: currentUser } = state();
    return service.resetPassword({ email: `hu17-history-${currentUser}@example.test`, code, password });
  }

  async function readState(codeId = otpId) {
    const { prisma: database, userId: currentUser } = state();
    return {
      user: await database.user.findUniqueOrThrow({ where: { id: currentUser }, select: { password: true, updatedAt: true } }),
      otp: await database.passwordResetOtp.findUniqueOrThrow({ where: { id: codeId }, select: { usedAt: true, attempts: true } }),
      history: await database.passwordHistory.findMany({ where: { userId: currentUser }, orderBy: { id: 'asc' } }),
    };
  }

  async function seedHistory(count: number) {
    const { prisma: database, userId: currentUser } = state();
    const rows = await Promise.all(Array.from({ length: count }, async (_, index) => ({
      id: randomUUID(), userId: currentUser,
      passwordHash: await bcrypt.hash(`AnteriorPassword${index}`, 4),
      createdAt: new Date(Date.now() - (index + 1) * 10_000),
    })));
    await database.passwordHistory.createMany({ data: rows });
    return rows;
  }

  beforeAll(async () => {
    const connection = new URL(buildDatabaseConnectionString('runtime'));
    if (connection.hostname !== '127.0.0.1' || connection.port !== '5433' ||
        decodeURIComponent(connection.pathname.slice(1)) !== 'umssy_hu17_history_test' ||
        (process.env.DB_SCHEMA && process.env.DB_SCHEMA !== 'public')) {
      throw new Error('Estas pruebas requieren exclusivamente PostgreSQL local en 127.0.0.1:5433/umssy_hu17_history_test y el esquema public.');
    }
    prisma = new PrismaService();
    await prisma.$connect();
    const [database] = await prisma.$queryRaw<Array<{ name: string }>>`SELECT current_database() AS name`;
    if (database.name !== 'umssy_hu17_history_test') throw new Error('La base conectada no corresponde al entorno aislado.');
    history = new PasswordHistoryRepository(prisma);
    historyService = new PasswordHistoryService(history);
    repository = new AuthRepository(prisma, history);
    service = new AuthService(repository, {} as JwtService, {} as MailService, refresh as unknown as RefreshTokenService, historyService);
  });

  beforeEach(async () => {
    refresh.revokeAllForUser.mockReset().mockResolvedValue(undefined);
    fixtureIds = [];
    originalHash = await bcrypt.hash('OriginalPassword1', 4);
    userId = await createUser(originalHash);
    otpId = (await issueCode()).id;
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    if (prisma && fixtureIds.length > 0) await prisma.user.deleteMany({ where: { id: { in: fixtureIds } } });
    userId = '';
    fixtureIds = [];
  });
  afterAll(async () => { await prisma?.$disconnect(); });

  it('rechaza la actual sin consumir el código y permite reintentar con una nueva', async () => {
    const before = await readState();
    await expect(reset('OriginalPassword1')).rejects.toBeInstanceOf(PasswordReusedException);
    expect(await readState()).toEqual(before);
    expect(refresh.revokeAllForUser).not.toHaveBeenCalled();
    await expect(reset('NuevaPassword1')).resolves.toMatchObject({ ok: true });
    expect(refresh.revokeAllForUser).toHaveBeenCalledTimes(1);
  });

  it('rechaza un hash retenido sin modificar el usuario, el código o el historial', async () => {
    const { prisma: database, userId: currentUser } = state();
    await database.passwordHistory.create({ data: { userId: currentUser, passwordHash: await bcrypt.hash('AnteriorPassword1', 4) } });
    const before = await readState();
    await expect(reset('AnteriorPassword1')).rejects.toBeInstanceOf(PasswordReusedException);
    expect(await readState()).toEqual(before);
    expect(refresh.revokeAllForUser).not.toHaveBeenCalled();
  });

  it('registra únicamente el hash anterior, cambia la contraseña y consume el código', async () => {
    await reset('NuevaPassword1');
    const saved = await readState();
    expect(saved.history).toHaveLength(1);
    expect(saved.history[0].passwordHash).toBe(originalHash);
    expect(saved.history[0].passwordHash).not.toBe('OriginalPassword1');
    expect(await bcrypt.compare('NuevaPassword1', saved.user.password ?? '')).toBe(true);
    expect(await bcrypt.compare('OriginalPassword1', saved.user.password ?? '')).toBe(false);
    expect(saved.otp.usedAt).not.toBeNull();
    expect(refresh.revokeAllForUser).toHaveBeenCalledWith(userId);
    expect(refresh.revokeAllForUser).toHaveBeenCalledTimes(1);
  });

  it('impide volver de A a B y después a A con un código nuevo', async () => {
    await reset('NuevaPassword1');
    const nextCode = await issueCode('654321');
    const before = await readState(nextCode.id);
    await expect(reset('OriginalPassword1', '654321')).rejects.toBeInstanceOf(PasswordReusedException);
    expect(await readState(nextCode.id)).toEqual(before);
    expect(refresh.revokeAllForUser).toHaveBeenCalledTimes(1);
  });

  it('retiene los últimos N y limpia los antiguos sin afectar a otro usuario', async () => {
    const { prisma: database, userId: currentUser } = state();
    const rows = await seedHistory(PASSWORD_HISTORY_LIMIT + 2);
    const otherUser = await createUser(originalHash);
    const otherRow = await database.passwordHistory.create({ data: { userId: otherUser, passwordHash: originalHash } });
    await reset('NuevaPassword1');
    const kept = await database.passwordHistory.findMany({ where: { userId: currentUser }, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }] });
    expect(kept).toHaveLength(PASSWORD_HISTORY_LIMIT);
    expect(kept[0].passwordHash).toBe(originalHash);
    expect(new Set(kept.slice(1).map(({ id }) => id))).toEqual(new Set(rows.slice(0, PASSWORD_HISTORY_LIMIT - 1).map(({ id }) => id)));
    expect(await database.passwordHistory.findMany({ where: { userId: otherUser } })).toEqual([otherRow]);
  });

  it('aplica la ventana N y acepta una contraseña que quedó fuera de ella', async () => {
    await seedHistory(PASSWORD_HISTORY_LIMIT + 1);
    await expect(reset(`AnteriorPassword${PASSWORD_HISTORY_LIMIT}`)).resolves.toMatchObject({ ok: true });
    expect((await readState()).history).toHaveLength(PASSWORD_HISTORY_LIMIT);
  });

  it('un error real de clave foránea al registrar revierte el cambio y el consumo', async () => {
    const before = await readState();
    vi.spyOn(history, 'recordPreviousAndTrim').mockImplementationOnce(async (transaction, _currentUser, hash) => {
      await transaction.passwordHistory.create({ data: { userId: randomUUID(), passwordHash: hash } });
    });
    await expect(reset('NuevaPassword1')).rejects.toThrow();
    expect(await readState()).toEqual(before);
    expect(refresh.revokeAllForUser).not.toHaveBeenCalled();
    await expect(reset('NuevaPassword1')).resolves.toMatchObject({ ok: true });
  });

  it('un fallo después de insertar y limpiar revierte también las eliminaciones del historial', async () => {
    await seedHistory(PASSWORD_HISTORY_LIMIT);
    const before = await readState();
    const record = history.recordPreviousAndTrim.bind(history);
    vi.spyOn(history, 'recordPreviousAndTrim').mockImplementationOnce(async (...args) => {
      await record(...args);
      throw new Error('simulated failure after history cleanup');
    });
    await expect(reset('NuevaPassword1')).rejects.toThrow('simulated failure after history cleanup');
    expect(await readState()).toEqual(before);
    expect(refresh.revokeAllForUser).not.toHaveBeenCalled();
  });

  it('rechaza una validación antigua y revierte el consumo de su código', async () => {
    const observed = await historyService.validateNewPassword(userId, 'CandidataPassword1');
    await reset('NuevaPassword1');
    const nextCode = await issueCode('654321');
    const before = await readState(nextCode.id);
    await expect(repository.updateUserPasswordAndInvalidateOtp(userId, await bcrypt.hash('CandidataPassword1', 4), nextCode.id, observed))
      .rejects.toBeInstanceOf(PasswordResetConflictException);
    expect(await readState(nextCode.id)).toEqual(before);
    expect(refresh.revokeAllForUser).toHaveBeenCalledTimes(1);
  });

  it('dos códigos distintos con la misma versión solo completan un cambio concurrente', async () => {
    const { prisma: database, userId: currentUser } = state();
    const secondCode = await database.passwordResetOtp.create({ data: {
      userId: currentUser, codeHash: await bcrypt.hash('654321', 4), expiresAt: new Date(Date.now() + 300_000),
    } });
    const hashes = await Promise.all([bcrypt.hash('ConcurrentPassword1', 4), bcrypt.hash('ConcurrentPassword1', 4)]);
    const outcomes = await Promise.allSettled([
      repository.updateUserPasswordAndInvalidateOtp(currentUser, hashes[0], otpId, originalHash),
      repository.updateUserPasswordAndInvalidateOtp(currentUser, hashes[1], secondCode.id, originalHash),
    ]);
    expect(outcomes.filter((outcome) => outcome.status === 'fulfilled')).toHaveLength(1);
    const rejected = outcomes.filter((outcome) => outcome.status === 'rejected');
    expect(rejected).toHaveLength(1);
    for (const outcome of rejected) if (outcome.status === 'rejected') expect(outcome.reason).toBeInstanceOf(PasswordResetConflictException);
    const codes = await database.passwordResetOtp.findMany({ where: { userId: currentUser } });
    expect(codes.filter((code) => code.usedAt !== null)).toHaveLength(1);
    const saved = await readState();
    expect(saved.history).toHaveLength(1);
    expect(saved.history[0].passwordHash).toBe(originalHash);
    expect(hashes).toContain(saved.user.password);
  });

  it('permite establecer la primera contraseña sin crear un hash anterior ficticio', async () => {
    const { prisma: database, userId: currentUser } = state();
    await database.user.update({ where: { id: currentUser }, data: { password: null } });
    await expect(reset('NuevaPassword1')).resolves.toMatchObject({ ok: true });
    const saved = await readState();
    expect(saved.history).toHaveLength(0);
    expect(saved.otp.usedAt).not.toBeNull();
    expect(await bcrypt.compare('NuevaPassword1', saved.user.password ?? '')).toBe(true);
  });
});
