import type { TransactionContext } from '../../../common/types/transaction-context.types.js';
import type { RadarApplicationConsent } from '../types/radar-application-consent.type.js';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';

/**
 * Consentimientos de postulación que habilitan el radar ante un reclutador.
 *
 * La creación y las reglas de postulación viven en `JobApplicationsService`;
 * aquí sólo se persisten y consultan los consentimientos independientes
 * (radar, CV y contacto) más las lecturas propias del reclutador.
 */
@Injectable()
export class RadarApplicationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async setConsents(
    applicationId: string,
    consent: boolean,
    cv: boolean,
    contact: boolean,
    context?: TransactionContext,
  ) {
    const client = context?.client ?? this.prisma;
    return client.$queryRaw<{ id: string }[]>`
      INSERT INTO radar_application_consents(application_id,consent_to_recruiter,consent_to_cv,consent_to_contact)
      VALUES (${applicationId}::uuid,${consent},${consent && cv},${consent && contact})
      ON CONFLICT(application_id) DO UPDATE SET
        consent_to_recruiter=EXCLUDED.consent_to_recruiter,consent_to_cv=EXCLUDED.consent_to_cv,
        consent_to_contact=EXCLUDED.consent_to_contact,updated_at=now()
      RETURNING application_id AS id`;
  }

  revokeConsents(applicationId: string) {
    return this.prisma.$executeRaw`
      UPDATE radar_application_consents SET consent_to_recruiter=FALSE,
        consent_to_cv=FALSE,consent_to_contact=FALSE,updated_at=now()
      WHERE application_id=${applicationId}::uuid`;
  }

  findConsents(ids: string[]) {
    return this.prisma.$queryRaw<RadarApplicationConsent[]>`
      SELECT application_id,consent_to_recruiter,consent_to_cv,consent_to_contact
      FROM radar_application_consents WHERE application_id=ANY(${ids}::uuid[])`;
  }
}
