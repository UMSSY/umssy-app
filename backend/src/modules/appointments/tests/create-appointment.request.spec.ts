import { describe, expect, it } from 'vitest';
import { APPOINTMENT_MESSAGES } from '../constants/appointment-docs.constants.js';
import { createAppointmentSchema } from '../requests/create-appointment.request.js';

const BLOCK_ID = '55555555-5555-4555-8555-555555555555';
const TOPIC_ID = '66666666-6666-4666-8666-666666666666';

const getMessages = (payload: unknown): string[] => {
  const result = createAppointmentSchema.safeParse(payload);
  return result.success ? [] : result.error.issues.map((issue) => issue.message);
};

describe('createAppointmentSchema', () => {
  it('acepta un bloque y un tema válidos con mensaje opcional', () => {
    expect(
      getMessages({ blockId: BLOCK_ID, orientationTypeId: TOPIC_ID, message: 'Hola' }),
    ).toEqual([]);
  });

  it('acepta el payload sin mensaje', () => {
    expect(getMessages({ blockId: BLOCK_ID, orientationTypeId: TOPIC_ID })).toEqual([]);
  });

  it('rechaza el payload sin tema con el texto del HU', () => {
    expect(getMessages({ blockId: BLOCK_ID })).toEqual([
      APPOINTMENT_MESSAGES.missingTopic,
    ]);
  });

  it('rechaza un tema que no es un uuid', () => {
    expect(
      getMessages({ blockId: BLOCK_ID, orientationTypeId: 'tema-raro' }),
    ).toEqual([APPOINTMENT_MESSAGES.invalidTopic]);
  });

  it('rechaza un bloque que no es un uuid', () => {
    expect(
      getMessages({ blockId: 'bloque-raro', orientationTypeId: TOPIC_ID }),
    ).toEqual([APPOINTMENT_MESSAGES.invalidBlockId]);
  });

  it('rechaza un mensaje de más de 300 caracteres', () => {
    expect(
      getMessages({
        blockId: BLOCK_ID,
        orientationTypeId: TOPIC_ID,
        message: 'x'.repeat(301),
      }),
    ).toEqual([APPOINTMENT_MESSAGES.messageTooLong]);
  });

  it('rechaza campos desconocidos', () => {
    expect(
      getMessages({ blockId: BLOCK_ID, orientationTypeId: TOPIC_ID, studentId: 'otro' }),
    ).toHaveLength(1);
  });
});
