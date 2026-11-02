import { EventRegistrationsRepository } from '../../src/modules/event-registrations/repositories/event-registrations.repository.js';
import { vi } from 'vitest';
import type { PrismaService } from '../../src/common/prisma/prisma.service.js';
import { EventsRepository } from '../../src/modules/events/repositories/events.repository.js';
import { EventsService } from '../../src/modules/events/index.js';
import { EventRegistrationsService } from '../../src/modules/event-registrations/services/event-registrations.service.js';
import type { RegistrationRecord } from '../../src/modules/event-registrations/types/registration-record.types.js';

export const EVENT_ID = '33333333-3333-4333-8333-333333333333';
export const USER_ID = '11111111-1111-4111-8111-111111111111';
export const REGISTRATION_ID = '44444444-4444-4444-8444-444444444444';
export const NOW = new Date('2026-10-23T12:00:00.000Z');

export function registrationRecord(overrides: Partial<RegistrationRecord> = {}): RegistrationRecord {
  return {
    id: REGISTRATION_ID,
    eventId: EVENT_ID,
    userId: USER_ID,
    status: { title: 'Confirmada' },
    qrToken: 'a'.repeat(64),
    registeredAt: new Date('2026-10-22T10:00:00.000Z'),
    cancelledAt: null,
    ...overrides,
  };
}

export function registrationFixture() {
  const event = {
    id: EVENT_ID,
    capacity: 1 as number | null,
    eventDate: new Date('2026-10-23T00:00:00.000Z'),
    startTime: new Date('1970-01-01T09:00:00.000Z'),
    endTime: new Date('1970-01-01T11:00:00.000Z'),
    status: { title: 'Publicado' },
  };
  const tx = {
    $queryRaw: vi.fn().mockResolvedValue([{ id: EVENT_ID }]),
    eventRegistration: {
      findUnique: vi.fn().mockResolvedValue(null),
      count: vi.fn().mockResolvedValue(0),
      create: vi.fn().mockImplementation(({ data }) => Promise.resolve(registrationRecord({ qrToken: data.qrToken }))),
      update: vi.fn().mockImplementation(({ data }) => Promise.resolve(registrationRecord({
        qrToken: data.qrToken ?? 'a'.repeat(64),
        status: { title: data.status.connect.title },
        cancelledAt: data.cancelledAt,
      }))),
    },
  };
  const prisma = {
    ...tx,
    $transaction: vi.fn().mockImplementation((operation) => operation(tx)),
  };
  const eventService = new EventsService(new EventsRepository(prisma as never));
  const events = { findForRegistration: vi.fn().mockResolvedValue(event), lockEventRow: eventService.lockEventRow.bind(eventService) };
  const service = new EventRegistrationsService(new EventRegistrationsRepository(prisma as unknown as PrismaService), events as unknown as EventsService);
  return { event, tx, prisma, events, service };
}
