import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { randomBytes, randomUUID } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import bcrypt from 'bcrypt';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { JwtService } from '@nestjs/jwt';
import { PrismaClient } from '../../../prisma/client.js';
import type { PrismaService } from '../../../common/prisma/prisma.service.js';
import { ApprovedAccountActivationService } from '../services/approved-account-activation.service.js';
import { ActivationOtpService } from '../services/activation-otp.service.js';
import { ActivationOtpRepository } from '../repositories/activation-otp.repository.js';
import { AccessRequestsService } from '../services/access-requests.service.js';
import { AccessRequestsRepository } from '../repositories/access-requests.repository.js';
import { AuthRepository } from '../../auth/repositories/auth.repository.js';
import { AuthService } from '../../auth/services/auth.service.js';
import { MentorsService } from '../../mentors/services/mentors.service.js';
import { MentorsRepository } from '../../mentors/repositories/mentors.repository.js';
import { MentorMapper } from '../../mentors/mappers/mentor.mapper.js';
import { MentorParticipationRepository } from '../../mentors/repositories/mentor-participation.repository.js';
import { MentorParticipationService } from '../../mentors/services/mentor-participation.service.js';
import { activateApprovedAccountSchema } from '../requests/activate-approved-account.schema.js';

const connectionString = process.env.HU7_TEST_DATABASE_URL;
const schema = `hu7_identity_test_${randomBytes(6).toString('hex')}`;
const password = 'OnlyForLocalTests123';

describe.skipIf(!connectionString)(
  'Epic 1 → cuenta aprobada → login → elegibilidad HU7',
  () => {
    let admin: pg.Client,
      prisma: PrismaClient,
      created = false;
    let activation: ApprovedAccountActivationService,
      requestId: string,
      careerId: string,
      reviewerId: string;
    let code: string;
    let inReviewId: string, areaId: string, orientationId: string;
    const mail = { sendActivationCode: vi.fn(), sendRejection: vi.fn() };
    const db = () => prisma as unknown as PrismaService;

    beforeAll(async () => {
      if (
        !['localhost', '127.0.0.1', '[::1]'].includes(
          new URL(connectionString!).hostname,
        )
      )
        throw new Error('Solo PostgreSQL local');
      admin = new pg.Client({ connectionString });
      await admin.connect();
      await admin.query(`CREATE SCHEMA "${schema}"`);
      created = true;
      await admin.query(`SET search_path TO "${schema}", public`);
      const migrations = new URL(
        '../../../../prisma/migrations/',
        import.meta.url,
      );
      for (const name of (await readdir(migrations))
        .filter((entry) => /^\d/.test(entry))
        .sort()) {
        await admin.query(
          await readFile(new URL(`${name}/migration.sql`, migrations), 'utf8'),
        );
      }
      prisma = new PrismaClient({
        adapter: new PrismaPg(
          {
            connectionString,
            options: `-c search_path=${schema} -c TimeZone=UTC`,
          },
          { schema },
        ),
      });
      activation = new ApprovedAccountActivationService(db());
      inReviewId = (
        await prisma.accessRequestStatus.create({
          data: { title: 'in_review' },
        })
      ).id;
      await prisma.accessRequestStatus.create({ data: { title: 'approved' } });
      careerId = (
        await prisma.career.create({ data: { title: 'HU7 identity test' } })
      ).id;
      reviewerId = (
        await prisma.user.create({
          data: {
            firstName: 'Reviewer',
            lastName: 'Test',
            email: 'reviewer@example.test',
          },
        })
      ).id;
      await prisma.role.createMany({
        data: [{ name: 'titulado' }, { name: 'mentor' }],
      });
      areaId = (
        await prisma.technicalArea.create({ data: { name: 'HU7 test' } })
      ).id;
      orientationId = (
        await prisma.orientationType.create({ data: { name: 'HU7 test' } })
      ).id;
    }, 30000);

    afterAll(async () => {
      await prisma?.$disconnect();
      if (created) await admin.query(`DROP SCHEMA "${schema}" CASCADE`);
      await admin?.end();
    });

    beforeEach(async () => {
      code = '';
      mail.sendActivationCode
        .mockReset()
        .mockImplementation(async (_to: string, value: string) => {
          code = value;
        });
      const suffix = randomBytes(6).toString('hex');
      requestId = (
        await prisma.accessRequest.create({
          data: {
            firstName: 'Approved',
            lastName: 'Graduate',
            email: `graduate.${suffix}@example.test`,
            idCardNumber: suffix,
            sisCode: suffix,
            idCardIssuedIn: 'CB',
            birthDate: new Date('1990-01-01'),
            graduationYear: 2025,
            careerId,
            statusId: inReviewId,
          },
        })
      ).id;
    });
    async function approve() {
      const otp = new ActivationOtpService(
        new ActivationOtpRepository(db()),
        mail,
      );
      // These dependencies are unused by the existing approval operation.
      const service = new AccessRequestsService(
        new AccessRequestsRepository(db()),
        {} as never,
        {} as never,
        otp,
        {} as never,
      );
      expect(await service.approve(requestId, reviewerId)).toMatchObject({
        status: 'approved',
        activationCodeSent: true,
      });
      expect(code).toMatch(/^\d{6}$/);
      expect(mail.sendActivationCode).toHaveBeenCalledWith(
        expect.stringContaining('@example.test'),
        code,
        expect.any(Date),
        requestId,
      );
    }
    const input = () => ({ code, password });

    it('consume el OTP real, vincula el usuario explícitamente y conserva el login JWT existente', async () => {
      await approve();
      await activation.activate(requestId, input());
      const request = await prisma.accessRequest.findUniqueOrThrow({
        where: { id: requestId },
      });
      expect(request.approvedUserId).toBeTruthy();
      const user = await prisma.user.findUniqueOrThrow({
        where: { id: request.approvedUserId! },
      });
      expect(await bcrypt.compare(password, user.password!)).toBe(true);
      const auth = new AuthService(
        new AuthRepository(db()),
        new JwtService({ secret: 'local-test-secret' }),
      );
      const session = await auth.login({ email: user.email, password });
      expect(
        new JwtService({ secret: 'local-test-secret' }).verify(
          session.accessToken,
        ).sub,
      ).toBe(user.id);
      expect(session.roles).toContain('titulado');
      // With only one approved and linked graduate there are no slots, rather
      // than an eligibility rejection or an inferred email match.
      await expect(
        new MentorsService(
          new MentorsRepository(db()),
          new MentorMapper(),
        ).activate(
          user.id,
          { technicalAreaIds: [areaId], orientationTypeIds: [orientationId] },
          randomUUID(),
        ),
      ).rejects.toMatchObject({ statusCode: 409 });
    const participation = new MentorParticipationService(new MentorParticipationRepository(db()));
    const pending = await participation.create(user.id, { technicalAreaIds: [areaId], orientationTypeIds: [orientationId] }, randomUUID());
    expect(await participation.findMyRequest(user.id)).toMatchObject({ id: pending.id, userId: user.id, status: 'PENDING' });
      await expect(
        activation.activate(requestId, input()),
      ).rejects.toMatchObject({ statusCode: 400 });
      expect(await prisma.user.count({ where: { email: user.email } })).toBe(1);
    });

    it('no vincula solo por correo y un OTP incorrecto consume un intento persistente', async () => {
      await approve();
      await expect(
        activation.activate(requestId, {
          ...input(),
          code: code === '000000' ? '111111' : '000000',
        }),
      ).rejects.toMatchObject({ statusCode: 400 });
      expect(
        await prisma.accessRequest.findUniqueOrThrow({
          where: { id: requestId },
        }),
      ).toMatchObject({ approvedUserId: null });
      expect(
        await prisma.activationOtp.findFirstOrThrow({
          where: { accessRequestId: requestId },
        }),
      ).toMatchObject({ attempts: 1, usedAt: null });
    });

    it('rechaza códigos vencidos y solicitudes todavía no aprobadas', async () => {
      await expect(
        activation.activate(requestId, { code: '123456', password }),
      ).rejects.toMatchObject({ statusCode: 400 });
      await approve();
      await prisma.activationOtp.updateMany({
        where: { accessRequestId: requestId },
        data: { expiresAt: new Date(0) },
      });
      await expect(
        activation.activate(requestId, input()),
      ).rejects.toMatchObject({ statusCode: 400 });
      expect(
        await prisma.accessRequest.findUniqueOrThrow({
          where: { id: requestId },
        }),
      ).toMatchObject({ approvedUserId: null });
    });

    it('bloquea después de cinco códigos incorrectos aunque después llegue el correcto', async () => {
      await approve();
      for (let i = 0; i < 5; i++)
        await expect(
          activation.activate(requestId, {
            code: code === '000000' ? '111111' : '000000',
            password,
          }),
        ).rejects.toMatchObject({ statusCode: 400 });
      await expect(
        activation.activate(requestId, input()),
      ).rejects.toMatchObject({ statusCode: 400 });
      expect(
        await prisma.activationOtp.findFirstOrThrow({
          where: { accessRequestId: requestId },
        }),
      ).toMatchObject({ attempts: 5, usedAt: null });
    });

    it('no cambia la contraseña de una cuenta existente; vincular exige su contraseña actual', async () => {
      const request = await prisma.accessRequest.findUniqueOrThrow({
        where: { id: requestId },
      });
      const originalHash = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: {
          email: request.email,
          firstName: 'Existing',
          lastName: 'Account',
          password: originalHash,
        },
      });
      await approve();
      await expect(
        activation.activate(requestId, {
          code,
          password: 'DifferentPassword123',
        }),
      ).rejects.toMatchObject({ statusCode: 400 });
      expect(
        (await prisma.user.findUniqueOrThrow({ where: { id: user.id } }))
          .password,
      ).toBe(originalHash);
      await activation.activate(requestId, input());
      expect(
        await prisma.accessRequest.findUniqueOrThrow({
          where: { id: requestId },
        }),
      ).toMatchObject({ approvedUserId: user.id });
      expect(
        (await prisma.user.findUniqueOrThrow({ where: { id: user.id } }))
          .password,
      ).toBe(originalHash);
    });

    it('dos activaciones simultáneas solo consumen una vez el código y crean una cuenta', async () => {
      await approve();
      const results = await Promise.allSettled([
        activation.activate(requestId, input()),
        activation.activate(requestId, input()),
      ]);
      expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
      const request = await prisma.accessRequest.findUniqueOrThrow({
        where: { id: requestId },
      });
      expect(await prisma.user.count({ where: { email: request.email } })).toBe(
        1,
      );
    });
  },
);

describe('contrato de activación aprobada', () => {
  it('rechaza campos ajenos, códigos malformados y contraseñas que bcrypt truncaría', () => {
    expect(
      activateApprovedAccountSchema.safeParse({ code: '123456', password })
        .success,
    ).toBe(true);
    for (const data of [
      { code: '12345', password },
      { code: '123456', password: 'short' },
      { code: '123456', password: 'á'.repeat(40) },
      { code: '123456', password, userId: randomUUID() },
    ])
      expect(activateApprovedAccountSchema.safeParse(data).success).toBe(false);
  });
});
