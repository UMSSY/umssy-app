// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { parseEventDetail, parseEventItem } from './event-response';
import { parseRegistration } from './registration-response';
import {
  readArray,
  readBoolean,
  readCount,
  readRecord,
} from './response-validation';
const event = {
  id: '1',
  title: 'React',
  category: { id: 'cat', name: 'Tecnología' },
  eventDate: '2026-10-20',
  startTime: '09:00',
  endTime: '12:00',
  capacity: 30,
  availableSpots: 20,
  registrationCount: 10,
  statusId: 'published',
  modalityId: 'presencial',
};
describe('backend response validation', () => {
  it('normalizes missing optional fields before rendering', () => {
    expect(parseEventItem(event)).toMatchObject({
      description: null,
      location: null,
      instructorName: null,
    });
  });
  it('preserves proposal support data in list and detail responses', () => {
    const proposal = {
      ...event,
      status: 'voting',
      origin: 'Propuesta',
      supportCount: 14,
      supportThreshold: 20,
      supportsRemaining: 6,
      progressPercent: 70,
      votingDeadline: '2026-10-30T12:00:00.000Z',
      hasSupported: true,
    };

    expect(parseEventItem(proposal)).toMatchObject({
      status: 'voting',
      origin: 'Propuesta',
      supportCount: 14,
      supportThreshold: 20,
      supportsRemaining: 6,
      progressPercent: 70,
      votingDeadline: '2026-10-30T12:00:00.000Z',
      hasSupported: true,
    });
    expect(
      parseEventDetail({
        ...proposal,
        modality: { id: 'presencial', title: 'Presencial' },
      }),
    ).toMatchObject({ supportCount: 14, hasSupported: true });
  });
  it('preserves false and null proposal values', () => {
    expect(
      parseEventItem({
        ...event,
        hasSupported: false,
        supportsRemaining: null,
        progressPercent: null,
      }),
    ).toMatchObject({
      hasSupported: false,
      supportsRemaining: null,
      progressPercent: null,
    });
  });
  it.each([
    { supportCount: -1 },
    { supportsRemaining: -1 },
    { progressPercent: 12.5 },
    { hasSupported: 'true' },
    { origin: 42 },
  ])('rejects malformed proposal fields: %s', (fields) => {
    expect(() => parseEventItem({ ...event, ...fields })).toThrow(
      'La respuesta del backend no es válida.',
    );
  });
  it.each([
    null,
    undefined,
    {},
    { ...event, category: null },
    { ...event, registrationCount: NaN },
  ])('rejects malformed events: %s', (value) => {
    expect(() => parseEventItem(value)).toThrow(
      'La respuesta del backend no es válida.',
    );
  });
  it('rejects a detail with missing modality rather than crashing in the panel', () => {
    expect(() => parseEventDetail(event)).toThrow();
    expect(
      parseEventDetail({
        ...event,
        modality: { id: 'presencial', title: 'Presencial' },
      }).modality.title,
    ).toBe('Presencial');
  });
  it.each([null, undefined, {}, 'invalid'])(
    'rejects invalid collections: %s',
    (value) => {
      expect(() => readArray(value)).toThrow();
    },
  );
  it('accepts empty collections and rejects invalid count and object values', () => {
    expect(readArray([])).toEqual([]);
    expect(() => readCount(-1)).toThrow();
    expect(() => readRecord([])).toThrow();
  });
  it('accepts only actual boolean values', () => {
    expect(readBoolean(true)).toBe(true);
    expect(readBoolean(false)).toBe(false);
    expect(() => readBoolean(1)).toThrow();
    expect(() => readBoolean(null)).toThrow();
  });
  it('rejects missing passes and missing required fields', () => {
    expect(() => parseRegistration(null)).toThrow();
    expect(() => parseRegistration({ id: '1' })).toThrow();
  });
});
