import { describe, expect, it } from 'vitest';
import {
  APPOINTMENT_MESSAGES,
  APPOINTMENT_MESSAGE_MAX_LENGTH,
} from '../constants/appointment-docs.constants.js';
import { createAppointmentSchema } from '../requests/create-appointment.request.js';

const BLOCK_ID = '55555555-5555-4555-8555-555555555555';
const TOPIC_ID = '66666666-6666-4666-8666-666666666666';

const getMessages = (payload: unknown): string[] => {
  const result = createAppointmentSchema.safeParse(payload);
  return result.success ? [] : result.error.issues.map((issue) => issue.message);
};

const getMessage = (payload: unknown): string | null | undefined =>
  createAppointmentSchema.parse(payload).message;

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

  it('rechaza un mensaje que supera el límite de caracteres', () => {
    expect(
      getMessages({
        blockId: BLOCK_ID,
        orientationTypeId: TOPIC_ID,
        message: 'x'.repeat(APPOINTMENT_MESSAGE_MAX_LENGTH + 1),
      }),
    ).toEqual([APPOINTMENT_MESSAGES.messageTooLong]);
  });

  it('acepta un mensaje con la longitud exacta del límite', () => {
    expect(
      getMessages({
        blockId: BLOCK_ID,
        orientationTypeId: TOPIC_ID,
        message: 'x'.repeat(APPOINTMENT_MESSAGE_MAX_LENGTH),
      }),
    ).toEqual([]);
  });

  it('convierte el mensaje vacío en null', () => {
    expect(
      getMessage({ blockId: BLOCK_ID, orientationTypeId: TOPIC_ID, message: '' }),
    ).toBeNull();
  });

  it('convierte el mensaje en blanco en null', () => {
    expect(
      getMessage({ blockId: BLOCK_ID, orientationTypeId: TOPIC_ID, message: '   ' }),
    ).toBeNull();
  });

  it('recorta los espacios del mensaje', () => {
    expect(
      getMessage({ blockId: BLOCK_ID, orientationTypeId: TOPIC_ID, message: '  hola  ' }),
    ).toBe('hola');
  });

  it('rechaza campos desconocidos', () => {
    expect(
      getMessages({ blockId: BLOCK_ID, orientationTypeId: TOPIC_ID, studentId: 'otro' }),
    ).toHaveLength(1);
  });
});
