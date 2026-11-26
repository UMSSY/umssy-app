import { describe, expect, it } from 'vitest';
import { APPOINTMENT_MESSAGES } from '../constants/appointment-docs.constants.js';
import { createAppointmentSchema } from '../requests/create-appointment.request.js';

const BLOCK_ID = '55555555-5555-4555-8555-555555555555';
const TOPIC_ID = '66666666-6666-4666-8666-666666666666';
const MESSAGE = 'Quiero reforzar mis bases';

const getMessages = (payload: unknown): string[] => {
  const result = createAppointmentSchema.safeParse(payload);
  return result.success
    ? []
    : result.error.issues.map((issue) => issue.message);
};

const getMessage = (payload: unknown): string =>
  createAppointmentSchema.parse(payload).message;

describe('createAppointmentSchema', () => {
  it('acepta un bloque, un tema y un mensaje válidos', () => {
    expect(
      getMessages({
        blockId: BLOCK_ID,
        orientationTypeId: TOPIC_ID,
        message: 'Hola',
      }),
    ).toEqual([]);
  });

  it.each([
    ['sin mensaje', {}],
    ['con mensaje null', { message: null }],
    ['con mensaje vacío', { message: '' }],
    ['con mensaje en blanco', { message: '   ' }],
  ])('rechaza el payload %s con el texto del HU', (_case, message) => {
    expect(
      getMessages({
        blockId: BLOCK_ID,
        orientationTypeId: TOPIC_ID,
        ...message,
      }),
    ).toEqual([APPOINTMENT_MESSAGES.missingMessage]);
  });

  it('rechaza el payload sin tema con el texto del HU', () => {
    expect(getMessages({ blockId: BLOCK_ID, message: MESSAGE })).toEqual([
      APPOINTMENT_MESSAGES.missingTopic,
    ]);
  });

  it('rechaza un tema que no es un uuid', () => {
    expect(
      getMessages({
        blockId: BLOCK_ID,
        orientationTypeId: 'tema-raro',
        message: MESSAGE,
      }),
    ).toEqual([APPOINTMENT_MESSAGES.invalidTopic]);
  });

  it('rechaza un bloque que no es un uuid', () => {
    expect(
      getMessages({
        blockId: 'bloque-raro',
        orientationTypeId: TOPIC_ID,
        message: MESSAGE,
      }),
    ).toEqual([APPOINTMENT_MESSAGES.invalidBlockId]);
  });

  it('rechaza un mensaje que supera el límite de caracteres', () => {
    expect(
      getMessages({
        blockId: BLOCK_ID,
        orientationTypeId: TOPIC_ID,
        message: 'x'.repeat(300 + 1),
      }),
    ).toEqual([APPOINTMENT_MESSAGES.messageTooLong]);
  });

  it('acepta un mensaje con la longitud exacta del límite', () => {
    expect(
      getMessages({
        blockId: BLOCK_ID,
        orientationTypeId: TOPIC_ID,
        message: 'x'.repeat(300),
      }),
    ).toEqual([]);
  });

  it('mide el límite sobre el mensaje ya recortado', () => {
    expect(
      getMessage({
        blockId: BLOCK_ID,
        orientationTypeId: TOPIC_ID,
        message: ` ${'x'.repeat(300)} `,
      }),
    ).toHaveLength(300);
  });

  it('recorta los espacios del mensaje', () => {
    expect(
      getMessage({
        blockId: BLOCK_ID,
        orientationTypeId: TOPIC_ID,
        message: '  hola  ',
      }),
    ).toBe('hola');
  });

  it('rechaza campos desconocidos', () => {
    expect(
      getMessages({
        blockId: BLOCK_ID,
        orientationTypeId: TOPIC_ID,
        message: MESSAGE,
        studentId: 'otro',
      }),
    ).toHaveLength(1);
  });
});
