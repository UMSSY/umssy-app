import type { MyRegistrationResponse } from '../types/event-registrations.types.js';
import type { RegistrationEntity } from '../types/registration-entity.types.js';
import { mapEventSessions } from '../../events/index.js';

export class EventRegistrationsMapper {
  static toMyRegistration(entity: RegistrationEntity): MyRegistrationResponse {
    return {
      id: entity.id,
      eventId: entity.eventId,
      eventName: entity.event.title,
      date: entity.event.eventDate,
      startTime: entity.event.startTime,
      endTime: entity.event.endTime,
      location: entity.event.location ?? 'Virtual',
      sessions: mapEventSessions(entity.event.sessions),
      status: entity.status.title,
      registeredAt: entity.registeredAt.toISOString(),
      cancelledAt: entity.cancelledAt?.toISOString() ?? null,
    };
  }

  static toMyRegistrationList(
    entities: RegistrationEntity[],
  ): MyRegistrationResponse[] {
    return entities.map((e) => EventRegistrationsMapper.toMyRegistration(e));
  }
}
