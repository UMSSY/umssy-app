import { PasswordHistoryRepository } from '../src/modules/auth/repositories/password-history.repository.js';
import { randomUUID } from 'node:crypto';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../src/common/prisma/prisma.service.js';
import { buildDatabaseConnectionString } from '../src/common/prisma/build-connection-string.js';
import { MAX_OTP_ATTEMPTS } from '../src/modules/auth/constants/password-reset.constants.js';
import { InvalidResetCodeException } from '../src/modules/auth/exceptions/invalid-reset-code.exception.js';
import { AuthRepository } from '../src/modules/auth/repositories/auth.repository.js';

describe.skipIf(process.env.RUN_HU17_DB_TESTS !== '1')(
  'Persistencia y concurrencia del consumo del código en PostgreSQL',
  () => {
    let prisma: PrismaService | undefined;
    let repository: AuthRepository;
    let userId: string | undefined;
    let otpId: string;
    let originalHash: string;

    beforeAll(async () => {
      const connection = new URL(buildDatabaseConnectionString('runtime'));
      const databaseName = decodeURIComponent(connection.pathname.slice(1));
      if (
        !['localhost', '127.0.0.1', '[::1]'].includes(connection.hostname) ||
        !/(?:^|_)test(?:_|$)/i.test(databaseName)
      ) {
        throw new Error(
          'Estas pruebas requieren una base local cuyo nombre contenga test separado por guiones bajos.',
        );
      }

      prisma = new PrismaService();
      await prisma.$connect();
      const [database] = await prisma.$queryRaw<Array<{ name: string }>>`
        SELECT current_database() AS name
      `;
      if (database.name !== databaseName) {
        throw new Error(
          'La conexión no corresponde a la base de pruebas esperada.',
        );
      }
      repository = new AuthRepository(prisma, new PasswordHistoryRepository(prisma));
    });

    beforeEach(async () => {
      if (!prisma) throw new Error('No se inicializó la base de pruebas.');
      userId = randomUUID();
      otpId = randomUUID();
      originalHash = await bcrypt.hash('OriginalPassword1', 4);
      await prisma.user.create({
        data: {
          id: userId,
          firstName: 'Prueba',
          lastName: 'Recuperación',
          email: `hu17-${userId}@example.test`,
          password: originalHash,
        },
      });
      await prisma.passwordResetOtp.create({
        data: {
          id: otpId,
          userId,
          codeHash: await bcrypt.hash('123456', 4),
          expiresAt: new Date(Date.now() + 300_000),
        },
      });
    });

    afterEach(async () => {
      if (prisma && userId) {
        await prisma.user.deleteMany({ where: { id: userId } });
      }
      userId = undefined;
    });

    afterAll(async () => {
      await prisma?.$disconnect();
    });

    it('actualiza la contraseña y rechaza la reutilización del mismo código', async () => {
      if (!prisma || !userId)
        throw new Error('No se creó la solicitud de prueba.');
      const hash = await bcrypt.hash('NuevaPassword1', 4);
      await repository.updateUserPasswordAndInvalidateOtp(userId, hash, otpId, originalHash);

      await expect(
        repository.updateUserPasswordAndInvalidateOtp(
          userId,
          originalHash,
          otpId, originalHash),
      ).rejects.toBeInstanceOf(InvalidResetCodeException);
      const user = await prisma.user.findUniqueOrThrow({
        where: { id: userId },
      });
      const otp = await prisma.passwordResetOtp.findUniqueOrThrow({
        where: { id: otpId },
      });
      expect(await bcrypt.compare('NuevaPassword1', user.password ?? '')).toBe(
        true,
      );
      expect(
        await bcrypt.compare('OriginalPassword1', user.password ?? ''),
      ).toBe(false);
      expect(otp.usedAt).not.toBeNull();
    });

    it('dos transacciones concurrentes solo permiten un cambio de contraseña', async () => {
      if (!prisma || !userId)
        throw new Error('No se creó el usuario de prueba.');
      const hashes = await Promise.all([
        bcrypt.hash('PrimeraPassword1', 4),
        bcrypt.hash('SegundaPassword1', 4),
      ]);
      const currentUserId = userId;
      const outcomes = await Promise.allSettled(
        hashes.map((hash) =>
          repository.updateUserPasswordAndInvalidateOtp(
            currentUserId,
            hash,
            otpId, originalHash),
        ),
      );
      expect(
        outcomes.filter((result) => result.status === 'fulfilled'),
      ).toHaveLength(1);
      expect(
        outcomes.filter((result) => result.status === 'rejected'),
      ).toHaveLength(1);
      for (const outcome of outcomes) {
        if (outcome.status === 'rejected') {
          expect(outcome.reason).toBeInstanceOf(InvalidResetCodeException);
        }
      }
      const winner = outcomes.findIndex(
        (result) => result.status === 'fulfilled',
      );
      const user = await prisma.user.findUniqueOrThrow({
        where: { id: userId },
      });
      const otp = await prisma.passwordResetOtp.findUniqueOrThrow({
        where: { id: otpId },
      });
      expect(user.password).toBe(hashes[winner]);
      expect(otp.usedAt).not.toBeNull();
    });

    it('un fallo real al guardar la contraseña revierte el consumo y permite reintentar', async () => {
      if (!prisma || !userId)
        throw new Error('No se creó el usuario de prueba.');
      await expect(
        repository.updateUserPasswordAndInvalidateOtp(
          userId,
          'x'.repeat(256),
          otpId, originalHash),
      ).rejects.toThrow();
      const user = await prisma.user.findUniqueOrThrow({
        where: { id: userId },
      });
      const otp = await prisma.passwordResetOtp.findUniqueOrThrow({
        where: { id: otpId },
      });
      expect(user.password).toBe(originalHash);
      expect(otp.usedAt).toBeNull();

      const hash = await bcrypt.hash('ReintentoPassword1', 4);
      await repository.updateUserPasswordAndInvalidateOtp(userId, hash, otpId, originalHash);
      const updated = await prisma.user.findUniqueOrThrow({
        where: { id: userId },
      });
      expect(updated.password).toBe(hash);
    });

    it('un código de otro usuario no modifica la contraseña ni se consume', async () => {
      if (!prisma || !userId)
        throw new Error('No se creó el usuario de prueba.');
      await expect(
        repository.updateUserPasswordAndInvalidateOtp(
          randomUUID(),
          'new-hash',
          otpId, originalHash),
      ).rejects.toBeInstanceOf(InvalidResetCodeException);
      const user = await prisma.user.findUniqueOrThrow({
        where: { id: userId },
      });
      const otp = await prisma.passwordResetOtp.findUniqueOrThrow({
        where: { id: otpId },
      });
      expect(user.password).toBe(originalHash);
      expect(otp.usedAt).toBeNull();
    });

    it('emitir otro código invalida el anterior y deja disponible el nuevo', async () => {
      if (!prisma || !userId)
        throw new Error('No se creó el usuario de prueba.');
      const hash = await bcrypt.hash('654321', 4);
      const issued = await repository.createPasswordResetOtp(
        userId,
        hash,
        new Date(Date.now() + 300_000),
      );
      const previous = await prisma.passwordResetOtp.findUniqueOrThrow({
        where: { id: otpId },
      });
      const latest = await repository.findLatestValidOtp(userId);
      expect(previous.usedAt).not.toBeNull();
      expect(latest?.id).toBe(issued.id);
      expect(await bcrypt.compare('654321', latest?.codeHash ?? '')).toBe(true);
      expect(await bcrypt.compare('123456', latest?.codeHash ?? '')).toBe(
        false,
      );
    });

    it('un fallo al emitir otro código conserva disponible el anterior', async () => {
      if (!prisma || !userId)
        throw new Error('No se creó el usuario de prueba.');
      await expect(
        repository.createPasswordResetOtp(
          userId,
          'x'.repeat(256),
          new Date(Date.now() + 300_000),
        ),
      ).rejects.toThrow();
      const previous = await prisma.passwordResetOtp.findUniqueOrThrow({
        where: { id: otpId },
      });
      expect(previous.usedAt).toBeNull();
      expect((await repository.findLatestValidOtp(userId))?.id).toBe(otpId);
    });

    it.each(['used', 'expired', 'attempts'])(
      'rechaza un código no disponible: %s',
      async (state) => {
        if (!prisma || !userId)
          throw new Error('No se creó el usuario de prueba.');
        const previousUsedAt = state === 'used' ? new Date() : null;
        await prisma.passwordResetOtp.update({
          where: { id: otpId },
          data: {
            usedAt: previousUsedAt,
            expiresAt: new Date(
              Date.now() + (state === 'expired' ? -1_000 : 300_000),
            ),
            attempts: state === 'attempts' ? MAX_OTP_ATTEMPTS : 0,
          },
        });
        await expect(
          repository.updateUserPasswordAndInvalidateOtp(
            userId,
            'new-hash',
            otpId, originalHash),
        ).rejects.toBeInstanceOf(InvalidResetCodeException);
        const user = await prisma.user.findUniqueOrThrow({
          where: { id: userId },
        });
        const otp = await prisma.passwordResetOtp.findUniqueOrThrow({
          where: { id: otpId },
        });
        expect(user.password).toBe(originalHash);
        expect(otp.usedAt).toEqual(previousUsedAt);
      },
    );
  },
);
