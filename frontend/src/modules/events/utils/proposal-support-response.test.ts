// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { parseProposalSupportResponse } from './proposal-support-response';

const support = {
  eventId: 'proposal-1',
  status: 'voting',
  supportCount: 14,
  supportThreshold: 20,
  supportsRemaining: 6,
  progressPercent: 70,
  hasSupported: true,
};

const response = { statusCode: 201, ok: true, data: support };

describe('proposal support response', () => {
  it('preserves the event and progress returned by the backend', () => {
    expect(parseProposalSupportResponse(response, 'proposal-1')).toEqual(support);
  });

  it('accepts the published status and a nullable threshold from the backend type', () => {
    expect(parseProposalSupportResponse({
      ...response,
      data: {
        ...support,
        status: 'Publicado',
        supportThreshold: null,
        supportsRemaining: 0,
        progressPercent: 100,
      },
    }, 'proposal-1')).toMatchObject({ status: 'Publicado', supportThreshold: null });
  });

  it.each([
    { ...response, statusCode: 200 },
    { ...response, ok: false },
    { ...response, data: null },
    { ...response, data: { ...support, eventId: 'another-proposal' } },
    { ...response, data: { ...support, status: 'Vencido' } },
    { ...response, data: { ...support, supportCount: -1 } },
    { ...response, data: { ...support, supportsRemaining: 1.5 } },
    { ...response, data: { ...support, progressPercent: 101 } },
    { ...response, data: { ...support, hasSupported: false } },
    { ...response, data: { ...support, supportThreshold: undefined } },
  ])('rejects malformed support responses: %j', (invalid) => {
    expect(() => parseProposalSupportResponse(invalid, 'proposal-1')).toThrow(
      'La respuesta del backend no es válida.',
    );
  });
});
