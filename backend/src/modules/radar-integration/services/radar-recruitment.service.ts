import type { ApplicationConsentsResponse } from '../types/application-consents-response.type.js';
import type { ApplicationResponse } from '../types/application-response.type.js';
import type { ActiveVacancyResponse } from '../types/active-vacancy-response.type.js';
import type { RecruiterVacancyResponse } from '../types/recruiter-vacancy-response.type.js';
import { JobApplicationConsentRequiredException } from '../../matching/exceptions/job-application-consent-required.exception.js';
import {
  mapRecruiterCandidate,
  mapRecruiterVacancy,
  mapActiveVacancy,
  mapRecruiterAreaEvidence,
} from '../mappers/radar-recruitment.mapper.js';
import { ApplicationsService } from '../../applications/services/applications.service.js';
import { RadarRecruitmentSourcesService } from './radar-recruitment-sources.service.js';
import { Injectable } from '@nestjs/common';
import { ForbiddenRoleException } from '../../../common/exceptions/forbidden-role.exception.js';
import { DuplicateJobApplicationException } from '../../matching/exceptions/duplicate-job-application.exception.js';
import { JobApplicationsService } from '../../matching/services/job-applications.service.js';
import { RadarApplicationConflictException } from '../exceptions/radar-application-conflict.exception.js';
import { RadarApplicationNotFoundException } from '../exceptions/radar-application-not-found.exception.js';
import { RadarAreaUnknownException } from '../exceptions/radar-area-unknown.exception.js';
import { RadarCompanyNotFoundException } from '../exceptions/radar-company-not-found.exception.js';
import { RadarCompanyNotLinkedException } from '../exceptions/radar-company-not-linked.exception.js';
import { RadarCvNotSharedException } from '../exceptions/radar-cv-not-shared.exception.js';
import { RadarRecruiterDecisionInvalidException } from '../exceptions/radar-recruiter-decision-invalid.exception.js';
import { RadarVacancyUnavailableException } from '../exceptions/radar-vacancy-unavailable.exception.js';
import { RadarAccessRepository } from '../repositories/radar-access.repository.js';
import { RadarApplicationsService } from './radar-applications.service.js';
import { RadarRecruitmentRepository } from '../repositories/radar-recruitment.repository.js';
import {
  mapApplicationConsentsResponse,
  mapApplicationResponse,
  mapApplicationSummary,
} from '../mappers/radar-applications.mapper.js';
import { recruiterContactProjection } from '../recruiter-consent.js';
import {
  AREA_IDS,
  emptyScores,
  matchRadar,
  type Scores,
} from '../utils/radar-scoring.js';

@Injectable()
export class RadarRecruitmentService {
  constructor(
    private readonly repository: RadarRecruitmentRepository,
    private readonly access: RadarAccessRepository,
    private readonly applications: RadarApplicationsService,
    private readonly jobApplications: JobApplicationsService,
    private readonly sources: RadarRecruitmentSourcesService,
    private readonly applicationActions: ApplicationsService,
  ) {}

  private async requireApplicantRole(userId: string): Promise<void> {
    const active = await this.access.hasAnyRole(userId, [
      'titulado',
      'estudiante',
    ]);
    if (!active) {
      throw new ForbiddenRoleException('Se requiere rol titulado o estudiante');
    }
  }

  private async requireRole(userId: string, role: string): Promise<void> {
    const allowed = await this.access.hasRole(userId, role);
    if (!allowed) throw new ForbiddenRoleException(`Se requiere rol ${role}`);
  }

  private audit(
    userId: string,
    actorId: string | null,
    event: string,
    targetId: string | null,
    details: object = {},
  ) {
    return this.access.recordAudit(userId, actorId, event, targetId, details);
  }

  async grantCompany(adminId: string, userId: string, companyId: string) {
    await this.requireRole(adminId, 'administrativo');
    await this.requireRole(userId, 'empresa');
    if (!(await this.sources.companyExists(companyId))) {
      throw new RadarCompanyNotFoundException();
    }
    await this.sources.assignCompany(userId, companyId);
    await this.repository.grantCompany(userId, companyId);
    return { userId, companyId };
  }

  private async allowedCompany(userId: string, companyId: string) {
    await this.requireRole(userId, 'empresa');
    const assignedCompanyId = await this.sources.recruiterCompanyId(userId);
    if (assignedCompanyId !== companyId) {
      throw new RadarCompanyNotLinkedException();
    }
  }

  async activeVacancies(): Promise<ActiveVacancyResponse[]> {
    const jobs = await this.sources.activeVacancies();
    return jobs.map(mapActiveVacancy);
  }

  async apply(
    userId: string,
    jobId: string,
    consent: boolean,
    consentCv: boolean,
    consentContact = false,
  ): Promise<ApplicationResponse> {
    await this.requireApplicantRole(userId);
    if (!consent || !consentCv || !consentContact)
      throw new JobApplicationConsentRequiredException();

    let application = (await this.jobApplications.findMine(userId, jobId))
      .application;
    if (!application) {
      try {
        application = await this.jobApplications.apply(userId, jobId, {
          consent: true,
          consentCv: true,
          consentContact: true,
        });
      } catch (error) {
        if (!(error instanceof DuplicateJobApplicationException)) throw error;
        // Otra solicitud pudo crear la postulación concurrentemente.
        application = (await this.jobApplications.findMine(userId, jobId))
          .application;
      }
    }
    if (!application) {
      throw new RadarApplicationConflictException(
        'No se pudo recuperar la postulación',
      );
    }
    if (!['En revisión', 'Entrevista'].includes(application.status)) {
      throw new RadarApplicationConflictException(
        'La postulación ya tiene una decisión o fue retirada',
      );
    }

    const rows = await this.applications.setConsents(
      application.id,
      consent,
      consentCv,
      consentContact,
    );
    await this.audit(
      userId,
      userId,
      'application.consents_updated',
      application.id,
      {
        consent,
        consentCv: consent && consentCv,
        consentContact: consent && consentContact,
      },
    );

    return mapApplicationResponse(
      rows[0].id,
      jobId,
      application.status,
      consent,
      consentCv,
      consentContact,
    );
  }

  async myApplications(userId: string) {
    await this.requireApplicantRole(userId);
    const rows = await this.applications.myApplications(userId);
    return rows.map(mapApplicationSummary);
  }

  async updateMyApplicationConsents(
    userId: string,
    applicationId: string,
    consent: boolean,
    consentCv: boolean,
    consentContact: boolean,
  ): Promise<ApplicationConsentsResponse> {
    await this.requireApplicantRole(userId);
    const rows = await this.applications.updateConsents(
      userId,
      applicationId,
      consent,
      consentCv,
      consentContact,
    );
    if (!rows.length) {
      throw new RadarApplicationNotFoundException(
        'Postulación inexistente o retirada',
      );
    }
    await this.audit(
      userId,
      userId,
      'application.consents_updated',
      applicationId,
      {
        consent,
        consentCv: consent && consentCv,
        consentContact: consent && consentContact,
      },
    );
    return mapApplicationConsentsResponse(
      applicationId,
      rows[0].status_title,
      consent,
      consentCv,
      consentContact,
    );
  }

  async withdrawMyApplication(userId: string, applicationId: string) {
    await this.requireApplicantRole(userId);
    await this.applicationActions.withdrawApplication(applicationId, userId);
    await this.applications.revokeConsents(applicationId);
    await this.audit(userId, userId, 'application.withdrawn', applicationId);
    return { id: applicationId, state: 'withdrawn' as const };
  }

  async recruiterVacancies(
    userId: string,
  ): Promise<RecruiterVacancyResponse[]> {
    await this.requireRole(userId, 'empresa');
    const companyId = await this.sources.recruiterCompanyId(userId);
    if (!companyId) return [];
    const companyIds = [companyId];
    const offers = await this.sources.recruiterVacancies(companyIds);
    return offers.map(mapRecruiterVacancy);
  }

  private async targetFromSkills(
    skills: { skill: { areaId: string | null; name: string } }[],
    description: string,
  ): Promise<Scores> {
    const result = emptyScores();
    const selected = new Map(
      skills.map((pair) => [pair.skill.name.toLocaleLowerCase(), pair.skill]),
    );

    // Reglas transparentes de términos del catálogo, no NLP probabilístico.
    const catalog = await this.sources.catalogSkills();
    const text = description.normalize('NFKC').toLocaleLowerCase();
    for (const skill of catalog) {
      const term = skill.name.normalize('NFKC').toLocaleLowerCase();
      if (term.length < 3 || selected.has(term)) continue;
      const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(
        `(^|[^\\p{L}\\p{N}])${escaped}($|[^\\p{L}\\p{N}])`,
        'u',
      );
      if (regex.test(text)) selected.set(term, skill);
    }

    for (const skill of selected.values()) {
      if (AREA_IDS.some((id) => id === skill.areaId)) {
        const id = skill.areaId as keyof Scores;
        result[id] = Math.min(10, result[id] + 2.5);
      }
    }
    return result;
  }

  async recruiterApplicants(userId: string, jobId: string) {
    const job = await this.sources.publishedJob(jobId);
    if (!job) throw new RadarVacancyUnavailableException();
    await this.allowedCompany(userId, job.companyId);

    const target = await this.targetFromSkills(job.skills, job.description);
    const applications = await this.applications.applicants(jobId);
    const profiles = await Promise.all(
      applications.map(async (application) => {
        // Sólo se expone a quien autorizó compartir su radar y además tiene un
        // radar publicado. Sin consentimiento o sin radar no hay porcentaje.
        if (!application.consent_to_recruiter) return null;
        const [user, snapshots] = await Promise.all([
          this.sources.candidate(application.user_id),
          this.repository.latestSnapshot(application.user_id),
        ]);
        if (!user) return null;

        const latest = snapshots[0];
        const hasPublishedRadar =
          latest &&
          AREA_IDS.some((areaId) => Number(latest.scores[areaId]) > 0);
        if (!latest || !hasPublishedRadar) return null;

        const comparison = matchRadar(latest.scores, target);
        const sharedContact = recruiterContactProjection(
          application.consent_to_contact,
          user.email,
          user.phone,
        );
        return mapRecruiterCandidate({
          application,
          user,
          latest,
          comparison,
          sharedContact,
        });
      }),
    );

    return {
      vacancy: { id: job.id, title: job.title, target },
      totalApplications: applications.length,
      applicants: profiles
        .filter(
          (profile): profile is NonNullable<typeof profile> => profile !== null,
        )
        .sort((left, right) => right.comparison.match - left.comparison.match),
    };
  }

  async recruiterAreaEvidence(
    recruiterId: string,
    applicationId: string,
    areaId: string,
  ) {
    if (!AREA_IDS.some((id) => id === areaId)) {
      throw new RadarAreaUnknownException();
    }

    const applications =
      await this.applications.companyForEvidence(applicationId);
    const application = applications[0];
    if (!application) {
      throw new RadarApplicationNotFoundException(
        'Postulación no disponible para consulta',
      );
    }
    await this.allowedCompany(recruiterId, application.company_id);

    const snapshots = await this.repository.latestSnapshot(application.user_id);
    const publishedSkills = snapshots[0]?.evidence?.[areaId] ?? [];
    const empty = {
      education: [],
      certifications: [],
      experiences: [],
      tags: [],
    };
    if (!publishedSkills.length) return empty;

    const ids = publishedSkills.map((item) => item.id);
    const approved = await this.sources.approvedSkillReferences(
      application.user_id,
      ids,
    );
    const allowedIds = new Set(approved.map((item) => item.skillId));
    const refs = new Map<string, Set<string>>([
      ['education', new Set<string>()],
      ['certification', new Set<string>()],
      ['work-experience', new Set<string>()],
    ]);

    for (const row of approved) {
      if (!Array.isArray(row.evidenceRefs)) continue;
      for (const ref of row.evidenceRefs) {
        if (
          !ref ||
          typeof ref !== 'object' ||
          !('type' in ref) ||
          !('id' in ref)
        ) {
          continue;
        }
        const type = ref.type;
        const id = ref.id;
        if (typeof type === 'string' && typeof id === 'string') {
          refs.get(type)?.add(id);
        }
      }
    }

    const [education, certifications, experiences] = await Promise.all([
      this.sources.ownedEducation(application.user_id, [
        ...(refs.get('education') ?? []),
      ]),
      this.sources.ownedCertifications(application.user_id, [
        ...(refs.get('certification') ?? []),
      ]),
      this.sources.ownedExperiences(application.user_id, [
        ...(refs.get('work-experience') ?? []),
      ]),
    ]);

    return mapRecruiterAreaEvidence({
      education,
      certifications,
      experiences,
      publishedSkills: publishedSkills.filter((item) =>
        allowedIds.has(item.id),
      ),
    });
  }

  async recruiterCv(recruiterId: string, applicationId: string) {
    const rows = await this.applications.companyForCv(applicationId);
    const application = rows[0];
    if (!application) {
      throw new RadarApplicationNotFoundException('Postulación no encontrada');
    }
    await this.allowedCompany(recruiterId, application.company_id);
    if (!application.consent_to_cv) {
      throw new RadarCvNotSharedException(
        'El titular no autorizó compartir su CV',
      );
    }

    const cv = (await this.sources.currentCv(application.user_id))[0];
    if (!cv?.cv_pdf_data) {
      throw new RadarCvNotSharedException('No hay CV actual disponible');
    }

    await this.audit(
      application.user_id,
      recruiterId,
      'cv.recruiter_viewed',
      applicationId,
      { applicationId },
    );
    return Buffer.from(cv.cv_pdf_data, 'base64');
  }

  async decideApplication(
    recruiterId: string,
    applicationId: string,
    decision: string,
  ) {
    if (!['hired', 'rejected'].includes(decision)) {
      throw new RadarRecruiterDecisionInvalidException();
    }
    const rows = await this.applications.companyForDecision(applicationId);
    if (!rows.length) {
      throw new RadarApplicationNotFoundException('Postulación inexistente');
    }
    await this.allowedCompany(recruiterId, rows[0].company_id);

    const target = decision === 'hired' ? 'Aceptada' : 'No seleccionado';
    const updated = await this.applications.recordRecruiterDecision(
      applicationId,
      target,
    );
    if (!updated.length) {
      throw new RadarApplicationConflictException(
        'La postulación ya tiene una decisión o fue retirada',
      );
    }
    await this.audit(
      rows[0].user_id,
      recruiterId,
      `application.${decision}`,
      applicationId,
    );
    return { id: updated[0].id, state: decision };
  }
}
