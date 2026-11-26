import { describe, expect, it } from 'vitest';
import { ApplicationMapper } from '../mappers/application.mapper.js';
import type { ApplicationRecord } from '../types/application-record.types.js';
import { ApplicationStatus } from '../types/applications.types.js';

const NOW = new Date('2026-11-25T22:00:00.000Z');

function buildRecord(
  offerStatus: string = 'Publicada',
  expiresAt: Date | null = null,
): ApplicationRecord {
  return {
    id: 'app-1',
    jobOfferId: 'offer-1',
    appliedAt: new Date('2026-10-29T12:00:00.000Z'),
    status: { title: ApplicationStatus.IN_REVIEW },
    jobOffer: {
      title: 'Dev',
      expiresAt,
      status: { title: offerStatus },
      company: { title: 'Empresa A' },
    },
  };
}

describe('ApplicationMapper.toResponse', () => {
  const mapper = new ApplicationMapper();

  it('devuelve el contrato del cliente con la vacante disponible', () => {
    expect(mapper.toResponse(buildRecord(), 85, NOW)).toEqual({
      id: 'app-1',
      jobOfferId: 'offer-1',
      vacancyTitle: 'Dev',
      companyName: 'Empresa A',
      affinityPercentage: 85,
      status: ApplicationStatus.IN_REVIEW,
      appliedDate: '2026-10-29T12:00:00.000Z',
      vacancyAvailable: true,
    });
  });

  it('mantiene disponible una vacante publicada cuya fecha de expiración es futura', () => {
    const record = buildRecord('Publicada', new Date(NOW.getTime() + 1));

    expect(mapper.toResponse(record, 0, NOW).vacancyAvailable).toBe(true);
  });

  it.each([
    ['en el mismo instante', NOW],
    ['antes del instante actual', new Date(NOW.getTime() - 1)],
  ])(
    'marca como no disponible una vacante publicada que expiró %s, sin esperar al cierre automático',
    (_label, expiresAt) => {
      const record = buildRecord('Publicada', expiresAt);

      expect(mapper.toResponse(record, 0, NOW).vacancyAvailable).toBe(false);
    },
  );

  it.each(['Cerrada', 'Eliminada'])(
    'marca como no disponible una vacante en estado %s',
    (offerStatus) => {
      expect(
        mapper.toResponse(buildRecord(offerStatus), 0, NOW).vacancyAvailable,
      ).toBe(false);
    },
  );

  it('no altera el estado de la postulación cuando la vacante deja de estar disponible', () => {
    const response = mapper.toResponse(buildRecord('Cerrada'), 70, NOW);

    expect(response.status).toBe(ApplicationStatus.IN_REVIEW);
    expect(response.affinityPercentage).toBe(70);
  });
});
