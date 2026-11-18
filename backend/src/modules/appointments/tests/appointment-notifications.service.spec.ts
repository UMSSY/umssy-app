import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NOTIFICATION_TEMPLATES } from '../../notifications/constants/notification-templates.constants.js';
import { NotificationType } from '../../notifications/types/notification-type.enum.js';
import type { NotifyRequest } from '../../notifications/types/notify-request.type.js';
import type { NotifyResult } from '../../notifications/types/notify-result.type.js';
import {
  APPOINTMENT_NOTIFICATION_ACTION_URL,
  APPOINTMENT_NOTIFICATION_MAX_ATTEMPTS,
} from '../constants/appointment-notification.constants.js';
import { AppointmentNotificationChannel } from '../enums/appointment-notification-channel.enum.js';
import { AppointmentNotificationEvent } from '../enums/appointment-notification-event.enum.js';
import { AppointmentNotificationStatus } from '../enums/appointment-notification-status.enum.js';
import { AppointmentParticipantRole } from '../enums/appointment-participant-role.enum.js';
import { AppointmentNotificationsService } from '../notification/appointment-notifications.service.js';
import {
  APPOINTMENT_ID,
  createAppointmentRecord,
  MENTOR_ID,
  STUDENT_ID,
} from './fixtures/appointment-record.fixture.js';

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

type PendingInput = {
  appointmentId: string;
  recipientId: string;
  eventId: string;
  channelId: string;
  statusId: string;
};

type FakeRow = {
  id: string;
  appointmentId: string;
  recipientId: string;
  eventId: string;
  channelTitle: AppointmentNotificationChannel;
  status: AppointmentNotificationStatus;
  attempts: number;
  lastError: string | null;
  sentAt: Date | null;
};

const createFakeRepository = () => {
  const rows: FakeRow[] = [];
  let sequence = 0;

  const pending = (id: string) =>
    rows.find(
      (row) =>
        row.id === id && row.status === AppointmentNotificationStatus.PENDING,
    );

  const repository = {
    resolveCatalog: vi.fn((event: AppointmentNotificationEvent) =>
      Promise.resolve({
        eventId: `event-${event}`,
        statusIds: {
          pending: 'status-PENDING',
          sent: 'status-SENT',
          failed: 'status-FAILED',
        },
        channelIds: {
          IN_APP: 'channel-IN_APP',
          EMAIL: 'channel-EMAIL',
          PUSH: 'channel-PUSH',
        },
      }),
    ),
    createPending: vi.fn((inputs: PendingInput[]) => {
      for (const input of inputs) {
        const channelTitle = input.channelId.replace(
          'channel-',
          '',
        ) as AppointmentNotificationChannel;
        const duplicated = rows.some(
          (row) =>
            row.appointmentId === input.appointmentId &&
            row.recipientId === input.recipientId &&
            row.eventId === input.eventId &&
            row.channelTitle === channelTitle,
        );
        if (duplicated) {
          continue;
        }
        rows.push({
          id: `row-${++sequence}`,
          appointmentId: input.appointmentId,
          recipientId: input.recipientId,
          eventId: input.eventId,
          channelTitle,
          status: AppointmentNotificationStatus.PENDING,
          attempts: 0,
          lastError: null,
          sentAt: null,
        });
      }
      return Promise.resolve();
    }),
    findPendingRows: vi.fn((appointmentId: string, eventId: string) =>
      Promise.resolve(
        rows
          .filter(
            (row) =>
              row.appointmentId === appointmentId &&
              row.eventId === eventId &&
              row.status === AppointmentNotificationStatus.PENDING,
          )
          .map((row) => ({
            id: row.id,
            appointmentId: row.appointmentId,
            recipientId: row.recipientId,
            attempts: row.attempts,
            channel: { title: row.channelTitle },
          })),
      ),
    ),
    markSent: vi.fn((id: string, _statusId: string, sentAt: Date) => {
      const row = pending(id);
      if (row) {
        row.status = AppointmentNotificationStatus.SENT;
        row.sentAt = sentAt;
      }
      return Promise.resolve();
    }),
    recordFailure: vi.fn(
      (
        id: string,
        error: string,
        attempts: number,
        failedStatusId?: string,
      ) => {
        const row = pending(id);
        if (row) {
          row.attempts = attempts;
          row.lastError = error;
          if (failedStatusId) {
            row.status = AppointmentNotificationStatus.FAILED;
          }
        }
        return Promise.resolve();
      },
    ),
    discard: vi.fn((id: string) => {
      const index = rows.findIndex(
        (row) =>
          row.id === id && row.status === AppointmentNotificationStatus.PENDING,
      );
      if (index >= 0) {
        rows.splice(index, 1);
      }
      return Promise.resolve();
    }),
  };

  return { repository, rows };
};

const successFor = (request: NotifyRequest): NotifyResult => ({
  inAppCount: request.channels?.includes('IN_APP') ? 1 : 0,
  pushStatus: request.channels?.includes('PUSH') ? 'sent' : 'skipped',
  emailStatus: request.channels?.includes('EMAIL') ? 'sent' : 'skipped',
  deliveries: [],
});

describe('AppointmentNotificationsService', () => {
  let repository: ReturnType<typeof createFakeRepository>['repository'];
  let rows: FakeRow[];
  let notify: ReturnType<typeof vi.fn>;
  let service: AppointmentNotificationsService;

  beforeEach(() => {
    ({ repository, rows } = createFakeRepository());
    notify = vi.fn((request: NotifyRequest) =>
      Promise.resolve(successFor(request)),
    );
    service = new AppointmentNotificationsService(
      repository as never,
      { notify } as never,
    );
  });

  it('registra un aviso pendiente por destinatario y canal al confirmar la cita', async () => {
    await service.notifyBooked(createAppointmentRecord());

    expect(repository.createPending).toHaveBeenCalledOnce();
    const [inputs] = repository.createPending.mock.calls[0];
    expect(inputs).toHaveLength(6);
    expect(inputs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          appointmentId: APPOINTMENT_ID,
          recipientId: MENTOR_ID,
          eventId: `event-${AppointmentNotificationEvent.BOOKED}`,
          statusId: 'status-PENDING',
        }),
        expect.objectContaining({ recipientId: STUDENT_ID }),
      ]),
    );
    expect(rows).toHaveLength(6);
    expect(
      rows.every((row) => row.status === AppointmentNotificationStatus.SENT),
    ).toBe(true);
  });

  it('envía un solo aviso por destinatario y no lo duplica al terminar', async () => {
    await service.notifyBooked(createAppointmentRecord());

    expect(notify).toHaveBeenCalledTimes(2);
    expect(repository.findPendingRows).toHaveBeenCalledTimes(2);
    expect(
      rows.every((row) => row.sentAt instanceof Date && row.attempts === 0),
    ).toBe(true);
  });

  it('no vuelve a enviar avisos ya entregados cuando se repite el proceso', async () => {
    const appointment = createAppointmentRecord();

    await service.notifyBooked(appointment);
    await service.notifyBooked(appointment);

    expect(notify).toHaveBeenCalledTimes(2);
    expect(rows).toHaveLength(6);
  });

  it('arma la fecha y la hora en GMT-4 con el tema y la otra persona según el rol', async () => {
    await service.notifyBooked(createAppointmentRecord());

    const [mentorRequest, studentRequest] = notify.mock.calls.map(
      ([request]) => request,
    );
    expect(mentorRequest).toMatchObject({
      recipientIds: [MENTOR_ID],
      type: NotificationType.APPOINTMENT_BOOKED,
      actionUrl: APPOINTMENT_NOTIFICATION_ACTION_URL,
      groupKey: `appointment-notification:BOOKED:${APPOINTMENT_ID}`,
      payload: {
        counterpartName: 'Luis Flores',
        date: '23/10/2026',
        time: '10:00',
        topic: 'Orientación profesional',
        recipientRole: AppointmentParticipantRole.MENTOR,
      },
    });
    expect(studentRequest).toMatchObject({
      recipientIds: [STUDENT_ID],
      payload: {
        counterpartName: 'Ana Pérez',
        recipientRole: AppointmentParticipantRole.STUDENT,
      },
    });
  });

  it('muestra la fecha de Bolivia cuando el instante cruza la medianoche UTC', async () => {
    await service.notifyBooked(
      createAppointmentRecord({
        startAt: new Date('2026-10-24T01:30:00.000Z'),
        endAt: new Date('2026-10-24T02:00:00.000Z'),
      }),
    );

    const [[request]] = notify.mock.calls;
    expect(request.payload).toMatchObject({
      date: '23/10/2026',
      time: '21:30',
    });
  });

  it('reintenta solo el canal que falló sin reenviar los entregados', async () => {
    const emailFailures = new Map<string, number>();
    notify.mockImplementation((request: NotifyRequest) => {
      const result = successFor(request);
      const recipientId = request.recipientIds[0];
      if (request.channels?.includes('EMAIL')) {
        const failures = emailFailures.get(recipientId) ?? 0;
        if (failures < 1) {
          emailFailures.set(recipientId, failures + 1);
          result.emailStatus = 'failed';
        }
      }
      return Promise.resolve(result);
    });

    await service.notifyBooked(createAppointmentRecord());

    const channelsByCall = notify.mock.calls.map(
      ([request]) => request.channels,
    );
    expect(channelsByCall).toEqual([
      ['IN_APP', 'EMAIL', 'PUSH'],
      ['IN_APP', 'EMAIL', 'PUSH'],
      ['EMAIL'],
      ['EMAIL'],
    ]);
    const emailRows = rows.filter(
      (row) => row.channelTitle === AppointmentNotificationChannel.EMAIL,
    );
    expect(
      emailRows.every(
        (row) =>
          row.status === AppointmentNotificationStatus.SENT &&
          row.attempts === 1,
      ),
    ).toBe(true);
    expect(
      rows
        .filter(
          (row) => row.channelTitle !== AppointmentNotificationChannel.EMAIL,
        )
        .every((row) => row.attempts === 0),
    ).toBe(true);
  });

  it('deja el aviso fallido tras el tercer intento sin éxito', async () => {
    notify.mockImplementation((request: NotifyRequest) => {
      const result = successFor(request);
      if (request.channels?.includes('EMAIL')) {
        result.emailStatus = 'failed';
      }
      return Promise.resolve(result);
    });

    await service.notifyBooked(createAppointmentRecord());

    expect(notify).toHaveBeenCalledTimes(
      2 * APPOINTMENT_NOTIFICATION_MAX_ATTEMPTS,
    );
    const failed = rows.filter(
      (row) => row.status === AppointmentNotificationStatus.FAILED,
    );
    expect(failed).toHaveLength(2);
    expect(
      failed.every(
        (row) =>
          row.attempts === APPOINTMENT_NOTIFICATION_MAX_ATTEMPTS &&
          row.lastError === `Falló el envío por EMAIL`,
      ),
    ).toBe(true);
    expect(
      rows
        .filter(
          (row) => row.channelTitle !== AppointmentNotificationChannel.EMAIL,
        )
        .every((row) => row.status === AppointmentNotificationStatus.SENT),
    ).toBe(true);
  });

  it('no propaga un error del servicio de notificaciones y agota los reintentos', async () => {
    notify.mockRejectedValue(new Error('Servicio no disponible'));

    await expect(
      service.notifyBooked(createAppointmentRecord()),
    ).resolves.toBeUndefined();

    expect(notify).toHaveBeenCalledTimes(
      2 * APPOINTMENT_NOTIFICATION_MAX_ATTEMPTS,
    );
    expect(
      rows.every(
        (row) =>
          row.status === AppointmentNotificationStatus.FAILED &&
          row.attempts === APPOINTMENT_NOTIFICATION_MAX_ATTEMPTS &&
          row.lastError === 'Servicio no disponible',
      ),
    ).toBe(true);
  });

  it('respeta el canal que la plataforma omite por preferencia sin marcarlo fallido', async () => {
    notify.mockImplementation((request: NotifyRequest) => {
      const result = successFor(request);
      result.pushStatus = 'skipped';
      return Promise.resolve(result);
    });

    await service.notifyBooked(createAppointmentRecord());

    expect(repository.discard).toHaveBeenCalledTimes(2);
    expect(
      rows.some(
        (row) => row.channelTitle === AppointmentNotificationChannel.PUSH,
      ),
    ).toBe(false);
    expect(
      rows.every((row) => row.status === AppointmentNotificationStatus.SENT),
    ).toBe(true);
  });

  it('no propaga un fallo del registro de avisos', async () => {
    repository.resolveCatalog.mockRejectedValue(new Error('Base caída'));

    await expect(
      service.notifyBooked(createAppointmentRecord()),
    ).resolves.toBeUndefined();

    expect(notify).not.toHaveBeenCalled();
  });

  it('avisa la cancelación solo a la otra persona con quién canceló', async () => {
    await service.notifyCancelled(
      createAppointmentRecord({
        status: { title: 'CANCELLED' },
        cancelledById: STUDENT_ID,
        cancellationReason: 'Imprevisto',
      }),
      STUDENT_ID,
    );

    const [inputs] = repository.createPending.mock.calls[0];
    expect(inputs).toHaveLength(3);
    expect(inputs.every((input) => input.recipientId === MENTOR_ID)).toBe(true);

    const [[request]] = notify.mock.calls;
    expect(request).toMatchObject({
      recipientIds: [MENTOR_ID],
      actorId: STUDENT_ID,
      type: NotificationType.APPOINTMENT_CANCELLED,
      groupKey: `appointment-notification:CANCELLED:${APPOINTMENT_ID}`,
      payload: {
        cancelledByName: 'Luis Flores',
        date: '23/10/2026',
        time: '10:00',
        reason: 'Imprevisto',
      },
    });
    expect(request.payload).not.toHaveProperty('counterpartName');
  });

  it('muestra en el texto de la cancelación quién canceló, sin nombrar a quien recibe el aviso', async () => {
    await service.notifyCancelled(
      createAppointmentRecord({
        status: { title: 'CANCELLED' },
        cancelledById: STUDENT_ID,
        cancellationReason: 'Imprevisto',
      }),
      STUDENT_ID,
    );

    const [[request]] = notify.mock.calls;
    const template =
      NOTIFICATION_TEMPLATES[NotificationType.APPOINTMENT_CANCELLED];
    const title = template.renderTitle(request.payload as never);
    const body = template.renderBody(request.payload as never);

    expect(title).toBe('Cita cancelada');
    expect(body).toBe(
      'Luis Flores canceló tu cita del 23/10/2026 a las 10:00.',
    );
    expect(body).not.toContain('Ana Pérez');
    expect(body.length).toBeLessThanOrEqual(100);
  });

  it('muestra la fecha y la hora de Bolivia en la cancelación al cruzar la medianoche UTC', async () => {
    await service.notifyCancelled(
      createAppointmentRecord({
        status: { title: 'CANCELLED' },
        cancelledById: STUDENT_ID,
        cancellationReason: 'Imprevisto',
        startAt: new Date('2026-10-24T01:30:00.000Z'),
        endAt: new Date('2026-10-24T02:00:00.000Z'),
      }),
      STUDENT_ID,
    );

    const [[request]] = notify.mock.calls;
    expect(request.payload).toMatchObject({
      date: '23/10/2026',
      time: '21:30',
    });

    const template =
      NOTIFICATION_TEMPLATES[NotificationType.APPOINTMENT_CANCELLED];
    const body = template.renderBody(request.payload as never);
    expect(body).toBe(
      'Luis Flores canceló tu cita del 23/10/2026 a las 21:30.',
    );
  });

  it('avisa al titulado cuando la cancelación la hace el mentor', async () => {
    await service.notifyCancelled(
      createAppointmentRecord({
        status: { title: 'CANCELLED' },
        cancelledById: MENTOR_ID,
      }),
      MENTOR_ID,
    );

    const [[request]] = notify.mock.calls;
    expect(request.recipientIds).toEqual([STUDENT_ID]);
    expect(request.payload.cancelledByName).toBe('Ana Pérez');
  });

  it('no incluye un motivo vacío cuando la cita se canceló sin motivo', async () => {
    await service.notifyCancelled(
      createAppointmentRecord({
        status: { title: 'CANCELLED' },
        cancelledById: STUDENT_ID,
      }),
      STUDENT_ID,
    );

    const [[request]] = notify.mock.calls;
    expect(request.payload).not.toHaveProperty('reason');
  });

  it('no supera los 100 caracteres ni incluye datos privados en el texto del push', async () => {
    await service.notifyBooked(
      createAppointmentRecord({
        message: 'Necesito ayuda con mi tesis sobre redes neuronales',
      }),
    );

    const template =
      NOTIFICATION_TEMPLATES[NotificationType.APPOINTMENT_BOOKED];
    for (const [request] of notify.mock.calls) {
      const body = template.renderBody(request.payload as never);
      expect(template.renderTitle(request.payload as never)).toBe(
        'Nueva cita reservada',
      );
      expect(body.length).toBeLessThanOrEqual(100);
      expect(body).not.toContain('tesis');
      expect(request.payload).not.toHaveProperty('message');
      expect(request.payload).not.toHaveProperty('document');
    }
  });

  it('no incluye el motivo en el texto del push de cancelación', async () => {
    await service.notifyCancelled(
      createAppointmentRecord({
        status: { title: 'CANCELLED' },
        cancelledById: STUDENT_ID,
        cancellationReason: 'Motivo privado del titulado',
      }),
      STUDENT_ID,
    );

    const [[request]] = notify.mock.calls;
    const body = NOTIFICATION_TEMPLATES[
      NotificationType.APPOINTMENT_CANCELLED
    ].renderBody(request.payload as never);
    expect(body.length).toBeLessThanOrEqual(100);
    expect(body).toContain('a las 10:00');
    expect(body).not.toContain('Motivo privado');
  });
});
