import { describe, expect, it } from 'vitest';
import { radarPublishedPayloadSchema } from '../notification/radar-published-payload.schema.js';

describe('Radar publication notification payload', () => {
  const payload = {
    radarVersion: '2',
    publishedAt: '2026-11-17T12:00:00.000Z',
  };

  it('accepts a positive version and an ISO publication timestamp', () => {
    expect(radarPublishedPayloadSchema.parse(payload)).toEqual(payload);
  });

  it.each(['', '0', '-1', '1.5', 'version-2', 2])(
    'rejects invalid version %s',
    (radarVersion) => {
      expect(
        radarPublishedPayloadSchema.safeParse({ ...payload, radarVersion })
          .success,
      ).toBe(false);
    },
  );

  it.each(['', 'yesterday', '2026-11-17', '2026-02-30T12:00:00Z'])(
    'rejects invalid publication timestamp %s',
    (publishedAt) => {
      expect(
        radarPublishedPayloadSchema.safeParse({ ...payload, publishedAt })
          .success,
      ).toBe(false);
    },
  );
});
