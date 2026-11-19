import type { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { ZodValidationPipe } from 'nestjs-zod';
import request, { type Response } from 'supertest';
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
import {
  formatBoliviaDate,
  formatBoliviaTime,
} from '../../../common/utils/date-time.js';
import { DomainExceptionFilter } from '../../../common/filters/domain-exception.filter.js';
import { ResponseInterceptor } from '../../../common/interceptors/response.interceptor.js';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import { SessionRepository } from '../../../common/repositories/session.repository.js';
import { AppointmentStatusTitle } from '../../availability/enums/appointment-status-title.enum.js';
import { AvailabilityRepository } from '../../availability/repositories/availability.repository.js';
import { BlockedDatesService } from '../../availability/services/blocked-dates.service.js';
import { MentorsService } from '../../mentors/services/mentors.service.js';
import { AppVisibilityService } from '../../notifications/services/app-visibility.service.js';
import { MailDispatcherService } from '../../notifications/services/mail-dispatcher.service.js';
import { PushDispatcherService } from '../../notifications/services/push-dispatcher.service.js';
import { NotificationGateway } from '../../notifications/gateways/notification.gateway.js';
import { NotificationUserLookupRepository } from '../../notifications/repositories/notification-user-lookup.repository.js';
import { NotificationsRepository } from '../../notifications/repositories/notifications.repository.js';
import { PreferencesRepository } from '../../notifications/repositories/preferences.repository.js';
import { PUSH_TEXT_MAX_LENGTH } from '../../notifications/constants/push-notification.constants.js';
import { AppointmentsModule } from '../appointments.module.js';
import { AppointmentNotificationChannel } from '../enums/appointment-notification-channel.enum.js';
import { AppointmentNotificationStatus } from '../enums/appointment-notification-status.enum.js';
import { AppointmentNotificationsRepository } from '../repositories/appointment-notifications.repository.js';
import { AppointmentsRepository } from '../repositories/appointments.repository.js';
import {
  BookedNotificationHttpSeed,
  type InMemoryAppointmentNotificationRow,
} from './fixtures/booked-notification-http-seed.fixture.js';
import {
  OVERLAP_HTTP_ANCHOR,
  OVERLAP_TOPIC,
} from './fixtures/overlap-http-seed.fixture.js';

vi.mock(
  '../constants/appointment-notification.constants.js',
  async (importOriginal) => {
    const actual =
      await importOriginal<
        typeof import('../constants/appointment-notification.constants.js')
      >();
    return {
      ...actual,
      APPOINTMENT_NOTIFICATION_RETRY_DELAY_MS: 0,
    };
  },
);

const JWT_SECRET = 'appointments-booked-notification-http-secret';
const PRIVATE_MESSAGE =
  'Necesito ayuda con mi tesis sobre redes neuronales y un documento privado';
const jwt = new JwtService({ secret: JWT_SECRET });

describe('POST /appointments (integración HTTP del aviso de reserva)', () => {
  let app: INestApplication;
  let seed: BookedNotificationHttpSeed;
  let studentToken: string;

  beforeAll(() => {
    vi.useFakeTimers({ toFake: ['Date'], now: OVERLAP_HTTP_ANCHOR });
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  beforeEach(async () => {
    seed = new BookedNotificationHttpSeed();
    studentToken = jwt.sign({ sub: seed.studentId, roleTag: 'estudiante' });

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
      .overrideProvider(AppointmentNotificationsRepository)
      .useValue(seed.appointmentNotificationsRepository)
      .overrideProvider(NotificationsRepository)
      .useValue(seed.notificationsRepository)
      .overrideProvider(PreferencesRepository)
      .useValue(seed.preferencesRepository)
      .overrideProvider(NotificationUserLookupRepository)
      .useValue(seed.notificationUserLookupRepository)
      .overrideProvider(NotificationGateway)
      .useValue(seed.notificationGateway)
      .overrideProvider(AppVisibilityService)
      .useValue(seed.appVisibilityService)
      .overrideProvider(PushDispatcherService)
      .useValue(seed.pushDispatcher)
      .overrideProvider(MailDispatcherService)
      .useValue(seed.mailDispatcher)
      .overrideProvider(PrismaService)
      .useValue({})
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  const target = () => seed.blockFor(1, 6);

  const post = (
    blockId: string,
    message: string = 'Quiero reforzar mis bases',
  ) =>
    request(app.getHttpServer())
      .post('/appointments')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        blockId,
        orientationTypeId: OVERLAP_TOPIC.id,
        message,
      });

  const waitForNotifications = async () => {
    await vi.waitFor(
      () => {
        expect(seed.inAppNotifications.length).toBeGreaterThanOrEqual(2);
        expect(seed.pendingNotificationRows()).toHaveLength(0);
      },
      { timeout: 3000 },
    );
  };

  const expectConfirmed = (response: Response, blockId: string) => {
    expect(response.status).toBe(201);
    expect(response.body.data).toMatchObject({
      blockId,
      status: AppointmentStatusTitle.CONFIRMED,
    });
  };

  const emailRows = (): InMemoryAppointmentNotificationRow[] =>
    seed.appointmentNotificationRows.filter(
      (row) => row.channelTitle === AppointmentNotificationChannel.EMAIL,
    );

  const pushRows = (): InMemoryAppointmentNotificationRow[] =>
    seed.appointmentNotificationRows.filter(
      (row) => row.channelTitle === AppointmentNotificationChannel.PUSH,
    );

  it('avisa al mentor y al titulado con notificación, push y correo', async () => {
    const block = target();
    seed.setPreference(block.mentorId, {
      pushEnabled: true,
      emailEnabled: true,
      inAppEnabled: true,
    });
    seed.setPreference(seed.studentId, {
      pushEnabled: true,
      emailEnabled: true,
      inAppEnabled: true,
    });

    const response = await post(block.id, PRIVATE_MESSAGE);

    expectConfirmed(response, block.id);
    await waitForNotifications();

    const date = formatBoliviaDate(block.startAt);
    const time = formatBoliviaTime(block.startAt);
    const mentorName = seed.nameOf(block.mentorId);
    const studentName = seed.nameOf(seed.studentId);
    const mentorBody = `${studentName} reservó una cita contigo para el ${date} a las ${time}.`;
    const studentBody = `Tu cita con ${mentorName} quedó confirmada para el ${date} a las ${time}.`;

    expect(seed.inAppNotifications).toHaveLength(2);
    expect(seed.inAppFor(block.mentorId)).toHaveLength(1);
    expect(seed.inAppFor(block.mentorId)[0]).toMatchObject({
      title: 'Nueva cita reservada',
      body: mentorBody,
      link: '/appointments',
    });
    expect(seed.inAppFor(seed.studentId)).toHaveLength(1);
    expect(seed.inAppFor(seed.studentId)[0]).toMatchObject({
      title: 'Nueva cita reservada',
      body: studentBody,
      link: '/appointments',
    });
    expect(seed.gatewayEvents).toHaveLength(2);
    expect(seed.gatewayEvents.map((event) => event.userId).sort()).toEqual(
      [block.mentorId, seed.studentId].sort(),
    );

    expect(seed.pushDispatches).toHaveLength(2);
    expect(seed.pushFor(block.mentorId)[0]).toMatchObject({
      title: 'Nueva cita reservada',
      body: mentorBody,
      actionUrl: '/appointments',
    });
    expect(seed.pushFor(seed.studentId)[0]).toMatchObject({
      title: 'Nueva cita reservada',
      body: studentBody,
      actionUrl: '/appointments',
    });

    expect(seed.emailDispatches).toHaveLength(2);
    const mentorEmail = seed.emailFor(block.mentorId)[0];
    const studentEmail = seed.emailFor(seed.studentId)[0];
    expect(mentorEmail.content?.subject).toBe('Cita confirmada');
    expect(mentorEmail.content?.mjml).toContain('Cita confirmada');
    expect(mentorEmail.content?.text).toContain(`Titulado: ${studentName}`);
    expect(mentorEmail.content?.text).toContain(`Fecha: ${date}`);
    expect(mentorEmail.content?.text).toContain(
      `Hora: ${time} (hora de Bolivia, GMT-4)`,
    );
    expect(mentorEmail.content?.text).toContain(`Tema: ${OVERLAP_TOPIC.name}`);
    expect(mentorEmail.content?.text).toContain('/appointments');
    expect(studentEmail.content?.text).toContain(`Mentor: ${mentorName}`);
  });

  it('respeta las preferencias de correo y push sin impedir la reserva', async () => {
    const block = target();
    seed.setPreference(block.mentorId, {
      pushEnabled: true,
      emailEnabled: false,
      inAppEnabled: true,
    });

    const response = await post(block.id);

    expectConfirmed(response, block.id);
    await waitForNotifications();

    expect(seed.inAppNotifications).toHaveLength(2);
    expect(seed.emailFor(block.mentorId)).toHaveLength(0);
    expect(seed.emailFor(seed.studentId)).toHaveLength(1);
    expect(seed.pushFor(block.mentorId)).toHaveLength(1);
    expect(seed.pushFor(seed.studentId)).toHaveLength(0);
    expect(
      seed.rowsFor(block.mentorId, AppointmentNotificationChannel.EMAIL),
    ).toHaveLength(0);
    expect(
      seed.rowsFor(seed.studentId, AppointmentNotificationChannel.PUSH),
    ).toHaveLength(0);
  });

  it('deja el correo pendiente y lo reintenta sin duplicar la notificación', async () => {
    const block = target();
    seed.setPreference(block.mentorId, {
      pushEnabled: false,
      emailEnabled: true,
      inAppEnabled: true,
    });
    seed.setPreference(seed.studentId, {
      pushEnabled: false,
      emailEnabled: true,
      inAppEnabled: true,
    });
    seed.failEmailTimes(2);
    const before = seed.countAppointmentsOf(seed.studentId);

    const response = await post(block.id);

    expectConfirmed(response, block.id);
    await waitForNotifications();

    expect(seed.countAppointmentsOf(seed.studentId)).toBe(before + 1);
    expect(seed.inAppNotifications).toHaveLength(2);
    expect(
      seed.inAppNotifications.map((item) => item.recipientId).sort(),
    ).toEqual([block.mentorId, seed.studentId].sort());
    expect(seed.emailDispatches).toHaveLength(4);
    expect(emailRows()).toHaveLength(2);
    expect(
      emailRows().every(
        (row) =>
          row.status === AppointmentNotificationStatus.SENT &&
          row.attempts === 1,
      ),
    ).toBe(true);
    const failures = seed.failuresFor(AppointmentNotificationChannel.EMAIL);
    expect(failures).toHaveLength(2);
    expect(
      failures.every(
        (failure) =>
          failure.attempts === 1 &&
          failure.statusBefore === AppointmentNotificationStatus.PENDING &&
          failure.failedStatusId === undefined,
      ),
    ).toBe(true);
  });

  it('marca el aviso como fallido tras 3 intentos', async () => {
    const block = target();
    seed.setPreference(block.mentorId, {
      pushEnabled: false,
      emailEnabled: true,
      inAppEnabled: true,
    });
    seed.setPreference(seed.studentId, {
      pushEnabled: false,
      emailEnabled: true,
      inAppEnabled: true,
    });
    seed.failEmailAlways();

    const response = await post(block.id);

    expectConfirmed(response, block.id);
    await waitForNotifications();

    expect(seed.inAppNotifications).toHaveLength(2);
    expect(seed.emailDispatches).toHaveLength(6);
    expect(emailRows()).toHaveLength(2);
    expect(
      emailRows().every(
        (row) =>
          row.status === AppointmentNotificationStatus.FAILED &&
          row.attempts === 3 &&
          row.lastError === 'Falló el envío por EMAIL',
      ),
    ).toBe(true);
    const failures = seed.failuresFor(AppointmentNotificationChannel.EMAIL);
    expect(failures).toHaveLength(6);
    const terminal = failures.filter((failure) => failure.failedStatusId);
    expect(terminal).toHaveLength(2);
    expect(terminal.every((failure) => failure.attempts === 3)).toBe(true);
  });

  it('deja el push pendiente y lo reintenta sin reenviar lo entregado', async () => {
    const block = target();
    seed.setPreference(block.mentorId, {
      pushEnabled: true,
      emailEnabled: true,
      inAppEnabled: true,
    });
    seed.setPreference(seed.studentId, {
      pushEnabled: true,
      emailEnabled: true,
      inAppEnabled: true,
    });
    seed.failPushTimes(2);

    const response = await post(block.id);

    expectConfirmed(response, block.id);
    await waitForNotifications();

    expect(seed.inAppNotifications).toHaveLength(2);
    expect(seed.emailDispatches).toHaveLength(2);
    expect(seed.pushDispatches).toHaveLength(4);
    expect(pushRows()).toHaveLength(2);
    expect(
      pushRows().every(
        (row) =>
          row.status === AppointmentNotificationStatus.SENT &&
          row.attempts === 1,
      ),
    ).toBe(true);
    const failures = seed.failuresFor(AppointmentNotificationChannel.PUSH);
    expect(failures).toHaveLength(2);
    expect(
      failures.every(
        (failure) =>
          failure.attempts === 1 &&
          failure.statusBefore === AppointmentNotificationStatus.PENDING &&
          failure.failedStatusId === undefined,
      ),
    ).toBe(true);
  });

  it('no revierte la cita cuando el correo no está disponible', async () => {
    const block = target();
    seed.setPreference(block.mentorId, {
      pushEnabled: false,
      emailEnabled: true,
      inAppEnabled: true,
    });
    seed.setPreference(seed.studentId, {
      pushEnabled: false,
      emailEnabled: true,
      inAppEnabled: true,
    });
    seed.throwEmailAlways();
    const before = seed.countAppointmentsOf(seed.studentId);

    const response = await post(block.id);

    expectConfirmed(response, block.id);
    await waitForNotifications();

    expect(seed.countAppointmentsOf(seed.studentId)).toBe(before + 1);
    expect(seed.inAppNotifications).toHaveLength(2);
    expect(seed.emailDispatches).toHaveLength(6);
    expect(emailRows()).toHaveLength(2);
    expect(
      emailRows().every(
        (row) =>
          row.status === AppointmentNotificationStatus.FAILED &&
          row.attempts === 3,
      ),
    ).toBe(true);
  });

  it('limita el push a 100 caracteres y no filtra datos privados', async () => {
    const block = target();
    seed.setPreference(block.mentorId, {
      pushEnabled: true,
      emailEnabled: true,
      inAppEnabled: true,
    });
    seed.setPreference(seed.studentId, {
      pushEnabled: true,
      emailEnabled: true,
      inAppEnabled: true,
    });

    const response = await post(block.id, PRIVATE_MESSAGE);

    expectConfirmed(response, block.id);
    await waitForNotifications();

    expect(seed.pushDispatches).toHaveLength(2);
    for (const dispatch of seed.pushDispatches) {
      expect(dispatch.body.length).toBeLessThanOrEqual(PUSH_TEXT_MAX_LENGTH);
      expect(dispatch.body).not.toContain(PRIVATE_MESSAGE);
      expect(dispatch.body).not.toContain('documento');
    }
    for (const dispatch of seed.emailDispatches) {
      expect(dispatch.content?.text).not.toContain(PRIVATE_MESSAGE);
      expect(dispatch.content?.text).not.toContain('documento');
    }
    for (const notification of seed.inAppNotifications) {
      expect(notification.body).not.toContain(PRIVATE_MESSAGE);
      expect(notification.body).not.toContain('documento');
    }
  });
});
