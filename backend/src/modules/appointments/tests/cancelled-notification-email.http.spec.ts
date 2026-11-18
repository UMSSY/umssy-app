import type { INestApplication } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { ZodValidationPipe } from 'nestjs-zod';
import request from 'supertest';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { DomainExceptionFilter } from '../../../common/filters/domain-exception.filter.js';
import { ResponseInterceptor } from '../../../common/interceptors/response.interceptor.js';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import { TransactionService } from '../../../common/prisma/transaction.service.js';
import { SessionRepository } from '../../../common/repositories/session.repository.js';
import { formatBoliviaDate } from '../../../common/utils/date-time.js';
import { AppointmentStatusTitle } from '../../availability/enums/appointment-status-title.enum.js';
import { AvailabilityRepository } from '../../availability/repositories/availability.repository.js';
import { BlockedDatesService } from '../../availability/services/blocked-dates.service.js';
import { MailService } from '../../mail/services/mail.service.js';
import type { SendMailPayload } from '../../mail/types/send-mail-payload.types.js';
import { MentorsService } from '../../mentors/services/mentors.service.js';
import { NotificationGateway } from '../../notifications/gateways/notification.gateway.js';
import { NotificationUserLookupRepository } from '../../notifications/repositories/notification-user-lookup.repository.js';
import { NotificationsRepository } from '../../notifications/repositories/notifications.repository.js';
import { PreferencesRepository } from '../../notifications/repositories/preferences.repository.js';
import { AppVisibilityService } from '../../notifications/services/app-visibility.service.js';
import { PushDispatcherService } from '../../notifications/services/push-dispatcher.service.js';
import { AppointmentsModule } from '../appointments.module.js';
import { AppointmentNotificationChannel } from '../enums/appointment-notification-channel.enum.js';
import { AppointmentNotificationStatus } from '../enums/appointment-notification-status.enum.js';
import { AppointmentNotificationsRepository } from '../repositories/appointment-notifications.repository.js';
import { AppointmentsRepository } from '../repositories/appointments.repository.js';
import type { AppointmentRecord } from '../types/appointment-record.types.js';
import { InMemoryAppointmentNotifications } from './fixtures/in-memory-appointment-notifications.fixture.js';
import {
  InMemoryOverlapSeed,
  OVERLAP_HTTP_ANCHOR,
  type TestTransaction,
} from './fixtures/overlap-http-seed.fixture.js';

vi.mock(
  '../constants/appointment-notification.constants.js',
  async (importOriginal) => ({
    ...(await importOriginal<
      typeof import('../constants/appointment-notification.constants.js')
    >()),
    APPOINTMENT_NOTIFICATION_RETRY_DELAY_MS: 0,
  }),
);

const JWT_SECRET = 'appointments-cancelled-email-http-secret';
const MINUTE = 60 * 1000;
const REASON = 'Me surgió una reunión de trabajo';

const jwt = new JwtService({ secret: JWT_SECRET });

const emailOf = (userId: string) => `${userId}@umssy.test`;

// Correo «Cita cancelada» de punta a punta: NotificationsService y
// MailDispatcherService reales; solo se simula el envío SMTP (MailService).
describe('Correo de cita cancelada (integración HTTP)', () => {
  let app: INestApplication;
  let seed: InMemoryOverlapSeed;
  let notifications: InMemoryAppointmentNotifications;
  let send: ReturnType<
    typeof vi.fn<(message: SendMailPayload) => Promise<void>>
  >;
  let emailEnabledFor: Set<string>;
  let mentorId: string;
  let studentId: string;
  let studentToken: string;
  let mentorToken: string;

  beforeAll(() => {
    vi.useFakeTimers({ toFake: ['Date'], now: OVERLAP_HTTP_ANCHOR });
    Logger.overrideLogger(false);
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  beforeEach(async () => {
    seed = new InMemoryOverlapSeed();
    notifications = new InMemoryAppointmentNotifications();
    send = vi.fn((_message: SendMailPayload) => Promise.resolve());
    mentorId = seed.mentorIdAt(1);
    studentId = seed.studentId;
    emailEnabledFor = new Set([mentorId, studentId]);
    studentToken = jwt.sign({ sub: studentId, roleTag: 'estudiante' });
    mentorToken = jwt.sign({ sub: mentorId, roleTag: 'mentor' });

    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }),
        AppointmentsModule,
      ],
      providers: [
        { provide: APP_FILTER, useClass: DomainExceptionFilter },
        { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
        { provide: APP_PIPE, useClass: ZodValidationPipe },
      ],
    })
      .overrideProvider(JwtService)
      .useValue(jwt)
      .overrideProvider(SessionRepository)
      .useValue(seed.sessionRepository)
      .overrideProvider(AvailabilityRepository)
      .useValue(seed.availabilityRepository)
      .overrideProvider(AppointmentsRepository)
      .useValue(seed.appointmentsRepository)
      .overrideProvider(BlockedDatesService)
      .useValue(seed.blockedDatesService)
      .overrideProvider(MentorsService)
      .useValue(seed.mentorsService)
      .overrideProvider(TransactionService)
      .useValue({
        run: async <T>(
          operation: (context: { client: TestTransaction }) => Promise<T>,
        ): Promise<T> => {
          const client: TestTransaction = { releases: [] };
          try {
            return await operation({ client });
          } finally {
            for (const release of client.releases) {
              release();
            }
          }
        },
      })
      .overrideProvider(PrismaService)
      .useValue({})
      .overrideProvider(AppointmentNotificationsRepository)
      .useValue(notifications.repository)
      .overrideProvider(NotificationsRepository)
      .useValue({
        findTypeByCode: (code: string) =>
          Promise.resolve({
            id: `type-${code}`,
            code,
            sendsPush: true,
            sendsEmail: true,
          }),
        createMany: (rows: { recipientId: string }[]) =>
          Promise.resolve(
            rows.map((row, index) => ({
              id: `in-app-${index}`,
              recipientId: row.recipientId,
            })),
          ),
      })
      .overrideProvider(PreferencesRepository)
      .useValue({
        findManyByUserIds: (userIds: string[]) =>
          Promise.resolve(
            userIds.map((userId) => ({
              userId,
              pushEnabled: false,
              emailEnabled: emailEnabledFor.has(userId),
            })),
          ),
      })
      .overrideProvider(NotificationUserLookupRepository)
      .useValue({
        hasBlockBetween: () => Promise.resolve(false),
        findContactByUserId: (userId: string) =>
          Promise.resolve({
            email: emailOf(userId),
            firstName: seed.nameOf(userId),
            lastName: '',
          }),
      })
      .overrideProvider(NotificationGateway)
      .useValue({ emitToUser: vi.fn() })
      .overrideProvider(AppVisibilityService)
      .useValue({ isVisible: () => false })
      .overrideProvider(PushDispatcherService)
      .useValue({ dispatchToUsers: vi.fn() })
      .overrideProvider(MailService)
      .useValue({ send })
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  const confirmedAppointment = (): AppointmentRecord =>
    seed.addAppointment({
      mentorId,
      studentId,
      startAt: new Date(OVERLAP_HTTP_ANCHOR.getTime() + 48 * 60 * MINUTE),
      endAt: new Date(OVERLAP_HTTP_ANCHOR.getTime() + (48 * 60 + 30) * MINUTE),
      status: AppointmentStatusTitle.CONFIRMED,
    });

  const cancel = (id: string, token: string, body: { reason?: string } = {}) =>
    request(app.getHttpServer())
      .patch(`/appointments/${id}/cancel`)
      .set('Authorization', `Bearer ${token}`)
      .send(body);

  const settled = (appointmentId: string) =>
    vi.waitFor(() => {
      const rows = notifications.rowsOf(appointmentId);
      expect(rows.length).toBeGreaterThan(0);
      expect(
        rows.every(
          (row) => row.status !== AppointmentNotificationStatus.PENDING,
        ),
      ).toBe(true);
    });

  const message = (index: number): SendMailPayload => {
    const call = send.mock.calls[index];
    if (!call) {
      throw new Error(`No se envió el correo ${index}`);
    }
    return call[0];
  };

  const emailRow = (appointmentId: string) =>
    notifications
      .rowsOf(appointmentId)
      .find((row) => row.channel === AppointmentNotificationChannel.EMAIL);

  it.each([
    { label: 'con motivo', body: { reason: REASON } },
    { label: 'sin motivo', body: {} },
  ])(
    'envía el correo «Cita cancelada» solo al mentor cuando cancela el titulado $label (CA1, CA2)',
    async ({ body }) => {
      const appointment = confirmedAppointment();

      const response = await cancel(appointment.id, studentToken, body);
      expect(response.status).toBe(200);
      await settled(appointment.id);

      expect(send).toHaveBeenCalledOnce();
      const email = message(0);
      expect(email.to).toBe(emailOf(mentorId));
      expect(email.subject).toBe('Cita cancelada');
      expect(email.text).toContain(seed.nameOf(studentId));
      expect(email.text).toContain(formatBoliviaDate(appointment.startAt));
      expect(email.values?.actionUrl).toMatch(/^https?:\/\/.+\/appointments$/);
      expect(emailRow(appointment.id)).toMatchObject({
        recipientId: mentorId,
        status: AppointmentNotificationStatus.SENT,
      });
    },
  );

  it('envía el correo solo al titulado cuando cancela el mentor y nunca a quien canceló (CA2)', async () => {
    const appointment = confirmedAppointment();

    await cancel(appointment.id, mentorToken, { reason: REASON });
    await settled(appointment.id);

    expect(send.mock.calls.map(([message]) => message.to)).toEqual([
      emailOf(studentId),
    ]);
    expect(message(0).text).toContain(seed.nameOf(mentorId));
  });

  it('respeta la preferencia de correo desactivada sin bloquear la cancelación (CA7)', async () => {
    emailEnabledFor.delete(mentorId);
    const appointment = confirmedAppointment();

    const response = await cancel(appointment.id, studentToken, {
      reason: REASON,
    });

    expect(response.status).toBe(200);
    await settled(appointment.id);
    expect(send).not.toHaveBeenCalled();
    expect(emailRow(appointment.id)).toBeUndefined();
  });

  it('reintenta el correo que falló y lo entrega una sola vez sin revertir la cancelación (CA4, CA10, CA11)', async () => {
    send
      .mockRejectedValueOnce(new Error('SMTP no disponible'))
      .mockResolvedValue(undefined);
    const appointment = confirmedAppointment();

    const response = await cancel(appointment.id, studentToken, {
      reason: REASON,
    });

    expect(response.status).toBe(200);
    await settled(appointment.id);
    expect(send).toHaveBeenCalledTimes(2);
    expect(emailRow(appointment.id)).toMatchObject({
      status: AppointmentNotificationStatus.SENT,
      attempts: 1,
    });
    expect(
      notifications
        .rowsOf(appointment.id)
        .filter((row) => row.channel === AppointmentNotificationChannel.IN_APP),
    ).toHaveLength(1);
  });
});
