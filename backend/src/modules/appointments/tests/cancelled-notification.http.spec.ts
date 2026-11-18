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
import {
  formatBoliviaDate,
  formatBoliviaTime,
} from '../../../common/utils/date-time.js';
import { AppointmentStatusTitle } from '../../availability/enums/appointment-status-title.enum.js';
import { AvailabilityRepository } from '../../availability/repositories/availability.repository.js';
import { BlockedDatesService } from '../../availability/services/blocked-dates.service.js';
import { MentorsService } from '../../mentors/services/mentors.service.js';
import { NOTIFICATION_TEMPLATES } from '../../notifications/constants/notification-templates.constants.js';
import { NotificationsService } from '../../notifications/services/notifications.service.js';
import { PushDispatcherService } from '../../notifications/services/push-dispatcher.service.js';
import { NotificationType } from '../../notifications/types/notification-type.enum.js';
import type { NotifyRequest } from '../../notifications/types/notify-request.type.js';
import type { NotifyResult } from '../../notifications/types/notify-result.type.js';
import { AppointmentsModule } from '../appointments.module.js';
import {
  APPOINTMENT_NOTIFICATION_ACTION_URL,
  APPOINTMENT_NOTIFICATION_MAX_ATTEMPTS,
} from '../constants/appointment-notification.constants.js';
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

// Sin pausa entre rondas de reintento para que el test no espere 5 s.
vi.mock(
  '../constants/appointment-notification.constants.js',
  async (importOriginal) => ({
    ...(await importOriginal<
      typeof import('../constants/appointment-notification.constants.js')
    >()),
    APPOINTMENT_NOTIFICATION_RETRY_DELAY_MS: 0,
  }),
);

const JWT_SECRET = 'appointments-cancelled-notification-http-secret';
const MINUTE = 60 * 1000;
const REASON = 'Me surgió una reunión de trabajo';
const ALL_CHANNELS = Object.values(AppointmentNotificationChannel);

const jwt = new JwtService({ secret: JWT_SECRET });

const delivered = (): NotifyResult => ({
  inAppCount: 1,
  pushStatus: 'sent',
  emailStatus: 'sent',
  deliveries: [],
});

describe('Aviso de cita cancelada (integración HTTP)', () => {
  let app: INestApplication;
  let seed: InMemoryOverlapSeed;
  let notifications: InMemoryAppointmentNotifications;
  let notify: ReturnType<
    typeof vi.fn<(request: NotifyRequest) => Promise<NotifyResult>>
  >;
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
    // El envío de la plataforma se simula solo en este test.
    notify = vi.fn((_request: NotifyRequest) => Promise.resolve(delivered()));
    mentorId = seed.mentorIdAt(1);
    studentId = seed.studentId;
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
      .overrideProvider(NotificationsService)
      .useValue({ notify })
      .overrideProvider(PushDispatcherService)
      .useValue({ dispatchToUsers: vi.fn() })
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  const confirmedAppointment = (hoursAhead = 48): AppointmentRecord =>
    seed.addAppointment({
      mentorId,
      studentId,
      startAt: new Date(
        OVERLAP_HTTP_ANCHOR.getTime() + hoursAhead * 60 * MINUTE,
      ),
      endAt: new Date(
        OVERLAP_HTTP_ANCHOR.getTime() + (hoursAhead * 60 + 30) * MINUTE,
      ),
      status: AppointmentStatusTitle.CONFIRMED,
    });

  const cancel = (id: string, token: string, body: { reason?: string } = {}) =>
    request(app.getHttpServer())
      .patch(`/appointments/${id}/cancel`)
      .set('Authorization', `Bearer ${token}`)
      .send(body);

  const getDetail = (id: string, token: string) =>
    request(app.getHttpServer())
      .get(`/appointments/${id}`)
      .set('Authorization', `Bearer ${token}`);

  // El aviso se lanza sin await después de responder: se espera a que
  // ninguna fila de la cita siga pendiente.
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

  const requests = () => notify.mock.calls.map(([call]) => call);

  it('avisa solo al mentor cuando cancela el titulado, con su nombre, fecha, hora y motivo (CA1, CA2)', async () => {
    const appointment = confirmedAppointment();

    const response = await cancel(appointment.id, studentToken, {
      reason: REASON,
    });
    expect(response.status).toBe(200);
    await settled(appointment.id);

    expect(notify).toHaveBeenCalledOnce();
    expect(requests()[0]).toEqual({
      recipientIds: [mentorId],
      type: NotificationType.APPOINTMENT_CANCELLED,
      payload: {
        cancelledByName: seed.nameOf(studentId),
        date: formatBoliviaDate(appointment.startAt),
        time: formatBoliviaTime(appointment.startAt),
        reason: REASON,
      },
      actionUrl: APPOINTMENT_NOTIFICATION_ACTION_URL,
      groupKey: `appointment-notification:CANCELLED:${appointment.id}`,
      actorId: studentId,
      channels: ALL_CHANNELS,
      renderMail: expect.any(Function),
    });
    expect(
      notifications.rowsOf(appointment.id).map((row) => row.recipientId),
    ).toEqual([mentorId, mentorId, mentorId]);
  });

  it('avisa solo al titulado cuando cancela el mentor y no incluye un motivo vacío (CA1, CA2)', async () => {
    const appointment = confirmedAppointment();

    const response = await cancel(appointment.id, mentorToken);
    expect(response.status).toBe(200);
    await settled(appointment.id);

    expect(notify).toHaveBeenCalledOnce();
    const [notice] = requests();
    expect(notice).toMatchObject({
      recipientIds: [studentId],
      actorId: mentorId,
      payload: {
        cancelledByName: seed.nameOf(mentorId),
      },
    });
    expect(notice?.payload).not.toHaveProperty('reason');
    expect(
      notifications
        .rowsOf(appointment.id)
        .every((row) => row.recipientId === studentId),
    ).toBe(true);
  });

  it('nunca avisa a quien canceló (criterio de la tarea)', async () => {
    const byStudent = confirmedAppointment();
    const byMentor = confirmedAppointment(72);

    await cancel(byStudent.id, studentToken, { reason: REASON });
    await cancel(byMentor.id, mentorToken);
    await settled(byStudent.id);
    await settled(byMentor.id);

    const recipientsOf = (actorId: string) =>
      requests()
        .filter((call) => call.actorId === actorId)
        .flatMap((call) => call.recipientIds);
    expect(recipientsOf(studentId)).toEqual([mentorId]);
    expect(recipientsOf(mentorId)).toEqual([studentId]);
  });

  it('no incluye el motivo en el texto del push y no supera 100 caracteres (CA3)', async () => {
    const appointment = confirmedAppointment();

    await cancel(appointment.id, studentToken, { reason: REASON });
    await settled(appointment.id);

    const [notice] = requests();
    const body = NOTIFICATION_TEMPLATES[
      NotificationType.APPOINTMENT_CANCELLED
    ].renderBody(notice?.payload as never);
    expect(body).not.toContain(REASON);
    expect(body.length).toBeLessThanOrEqual(100);
  });

  it('mantiene la cancelación aunque todos los envíos fallen y deja el aviso como fallido (CA4, CA10)', async () => {
    notify.mockRejectedValue(new Error('Servicio de notificaciones caído'));
    const appointment = confirmedAppointment();

    const response = await cancel(appointment.id, studentToken, {
      reason: REASON,
    });

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({ status: 'CANCELLED' });
    await settled(appointment.id);

    expect(notify).toHaveBeenCalledTimes(APPOINTMENT_NOTIFICATION_MAX_ATTEMPTS);
    expect(notifications.rowsOf(appointment.id)).toHaveLength(3);
    for (const row of notifications.rowsOf(appointment.id)) {
      expect(row).toMatchObject({
        status: AppointmentNotificationStatus.FAILED,
        attempts: APPOINTMENT_NOTIFICATION_MAX_ATTEMPTS,
        lastError: 'Servicio de notificaciones caído',
      });
    }

    const detail = await getDetail(appointment.id, mentorToken);
    expect(detail.status).toBe(200);
    expect(detail.body.data).toMatchObject({
      status: 'CANCELLED',
      cancellation: { cancelledBy: 'STUDENT', reason: REASON },
    });
  });

  it('reintenta solo el canal que falló sin duplicar los avisos entregados (CA7, CA11)', async () => {
    notify
      .mockResolvedValueOnce({ ...delivered(), emailStatus: 'failed' })
      .mockResolvedValue(delivered());
    const appointment = confirmedAppointment();

    await cancel(appointment.id, studentToken, { reason: REASON });
    await settled(appointment.id);

    expect(notify).toHaveBeenCalledTimes(2);
    expect(requests()[1]).toMatchObject({
      recipientIds: [mentorId],
      channels: [AppointmentNotificationChannel.EMAIL],
    });
    const rows = notifications.rowsOf(appointment.id);
    expect(rows).toHaveLength(3);
    expect(
      rows.every((row) => row.status === AppointmentNotificationStatus.SENT),
    ).toBe(true);
    expect(
      rows.find((row) => row.channel === AppointmentNotificationChannel.EMAIL),
    ).toMatchObject({ attempts: 1 });
  });

  it('no vuelve a avisar si la cita ya cancelada se cancela otra vez', async () => {
    const appointment = confirmedAppointment();

    await cancel(appointment.id, studentToken, { reason: REASON });
    await settled(appointment.id);
    const again = await cancel(appointment.id, studentToken);

    expect(again.status).toBe(200);
    expect(notify).toHaveBeenCalledOnce();
    expect(notifications.rowsOf(appointment.id)).toHaveLength(3);
  });
});
