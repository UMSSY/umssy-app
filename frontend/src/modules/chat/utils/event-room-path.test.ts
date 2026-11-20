import { describe, expect, it } from 'vitest';
import { getEventRoomPath } from './event-room-path';

describe('getEventRoomPath', () => {
  it('construye la ruta de la sala a partir del id de la inscripción', () => {
    expect(getEventRoomPath('registration-1')).toBe(
      '/chat/event/registration-1',
    );
  });

  it('codifica el id de la inscripción', () => {
    expect(getEventRoomPath('registration/1')).toBe(
      '/chat/event/registration%2F1',
    );
  });
});
