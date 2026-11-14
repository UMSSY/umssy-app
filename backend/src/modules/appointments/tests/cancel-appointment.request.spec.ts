import { describe, expect, it } from 'vitest';
import { APPOINTMENT_MESSAGES } from '../constants/appointment-docs.constants.js';
import { cancelAppointmentSchema } from '../requests/cancel-appointment.request.js';

const getMessages = (payload: unknown): string[] => {
  const result = cancelAppointmentSchema.safeParse(payload);
  return result.success
    ? []
    : result.error.issues.map((issue) => issue.message);
};

const getReason = (payload: unknown): string | undefined =>
  cancelAppointmentSchema.parse(payload).reason;

describe('cancelAppointmentSchema', () => {
  it('acepta un payload sin motivo', () => {
    expect(getMessages({})).toEqual([]);
  });

  it('acepta un motivo vacío', () => {
    expect(getMessages({ reason: '' })).toEqual([]);
  });

  it('acepta un motivo con la longitud exacta del límite', () => {
    expect(getMessages({ reason: 'x'.repeat(300) })).toEqual([]);
  });

  it('rechaza un motivo que supera el límite con el texto del HU', () => {
    expect(getMessages({ reason: 'x'.repeat(300 + 1) })).toEqual([
      APPOINTMENT_MESSAGES.reasonTooLong,
    ]);
  });

  it('mide el límite sobre el motivo ya recortado', () => {
    expect(getReason({ reason: ` ${'x'.repeat(300)} ` })).toHaveLength(300);
  });

  it('recorta los espacios del motivo', () => {
    expect(getReason({ reason: '  imprevisto  ' })).toBe('imprevisto');
  });

  it('rechaza un motivo que no es texto', () => {
    expect(getMessages({ reason: 42 })).toEqual([
      APPOINTMENT_MESSAGES.invalidReason,
    ]);
  });

  it('rechaza campos desconocidos', () => {
    expect(getMessages({ reason: 'Imprevisto', id: 'otro' })).toHaveLength(1);
  });
});
