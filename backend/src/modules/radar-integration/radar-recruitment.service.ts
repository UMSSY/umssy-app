import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RadarAccessRepository } from './repositories/radar-access.repository.js';
import { RadarRecruitmentRepository } from './repositories/radar-recruitment.repository.js';
import { RadarApplicationsRepository } from './repositories/radar-applications.repository.js';
import {
  mapApplicationStatus,
  mapApplicationSummary,
} from './mappers/radar-applications.mapper.js';
import { recruiterContactProjection } from './recruiter-consent.js';
import { AREA_IDS, emptyScores, matchRadar, type Scores } from './radar-scoring.js';

function isUniqueViolation(error: unknown): boolean {
  return (
    error instanceof Error &&
    'code' in error &&
    (error as { code?: unknown }).code === 'P2002'
  );
}

@Injectable()
export class RadarRecruitmentService {
  constructor(
    private readonly repository: RadarRecruitmentRepository,
    private readonly access: RadarAccessRepository,
    private readonly applications: RadarApplicationsRepository,
  ) {}

  private async requireApplicantRole(userId: string): Promise<void> {
    const active = await this.access.hasAnyRole(userId, ['titulado', 'estudiante']);
    if (!active) throw new ForbiddenException('Se requiere rol titulado o estudiante');
  }

  private async requireRole(userId: string, role: string): Promise<void> {
    const allowed = await this.access.hasRole(userId, role);
    if (!allowed) throw new ForbiddenException(`Se requiere rol ${role}`);
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
    if (!(await this.repository.companyExists(companyId))) {
      throw new NotFoundException('Empresa inexistente');
    }
    await this.repository.grantCompany(userId, companyId);
    return { userId, companyId };
  }

  private async allowedCompany(userId: string, companyId: string) {
    await this.requireRole(userId, 'empresa');
    const rows = await this.repository.allowedCompany(userId, companyId);
    if (!rows.length) {
      throw new ForbiddenException('Empresa no vinculada a esta sesión');
    }
  }

  async activeVacancies() {
    const jobs = await this.repository.activeVacancies();
    return jobs.map((job) => ({
      id: job.id,
      companyId: job.companyId,
      title: job.title,
      description: job.description,
    }));
  }

  // HU4: el Radar, el CV y el contacto requieren consentimientos independientes.
  // Postularse no obliga a compartir información privada.
  async apply(
    userId: string,
    jobId: string,
    consent: boolean,
    consentCv: boolean,
    consentContact = false,
  ) {
    await this.requireApplicantRole(userId);
    if (!(await this.applications.isOfferOpen(jobId, new Date()))) {
      throw new NotFoundException('Vacante no disponible');
    }

    let application = await this.applications.findMine(userId, jobId);
    if (!application) {
      const status = await this.applications.statusByTitle('En revisión');
      if (!status) throw new ConflictException('No existe el estado de postulación');
      try {
        application = await this.applications.create(userId, jobId, status.id);
      } catch (error) {
        if (!isUniqueViolation(error)) throw error;
        // Otra solicitud pudo crear la postulación concurrentemente.
        application = await this.applications.findMine(userId, jobId);
      }
    }
    if (!application) {
      throw new ConflictException('No se pudo recuperar la postulación');
    }
    if (!['En revisión', 'Entrevista'].includes(application.status.title)) {
      throw new ConflictException('La postulación ya tiene una decisión o fue retirada');
    }

    const rows = await this.applications.setConsents(
      application.id,
      consent,
      consentCv,
      consentContact,
    );
    await this.audit(userId, userId, 'application.consents_updated', application.id, {
      consent,
      consentCv: consent && consentCv,
      consentContact: consent && consentContact,
    });

    return {
      id: rows[0].id,
      jobOfferId: jobId,
      state: mapApplicationStatus(application.status.title),
      consent,
      consentCv: consent && consentCv,
      consentContact: consent && consentContact,
    };
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
  ) {
    await this.requireApplicantRole(userId);
    const rows = await this.applications.updateConsents(
      userId,
      applicationId,
      consent,
      consentCv,
      consentContact,
    );
    if (!rows.length) {
      throw new NotFoundException('Postulación inexistente o retirada');
    }
    await this.audit(userId, userId, 'application.consents_updated', applicationId, {
      consent,
      consentCv: consent && consentCv,
      consentContact: consent && consentContact,
    });
    return {
      id: applicationId,
      state: mapApplicationStatus(rows[0].status_title),
      consent,
      consentCv: consent && consentCv,
      consentContact: consent && consentContact,
    };
  }

  async withdrawMyApplication(userId: string, applicationId: string) {
    await this.requireApplicantRole(userId);
    const rows = await this.applications.withdraw(userId, applicationId);
    if (!rows.length) {
      throw new ConflictException('Sólo puedes retirar una postulación en revisión o entrevista');
    }
    await this.audit(userId, userId, 'application.withdrawn', applicationId);
    return { id: rows[0].id, state: 'withdrawn' as const };
  }

  async recruiterVacancies(userId: string) {
    await this.requireRole(userId, 'empresa');
    const rows = await this.repository.linkedCompanies(userId);
    if (!rows.length) return [];
    const companyIds = rows.map((row) => row.company_id);
    const offers = await this.repository.recruiterVacancies(companyIds);
    return offers.map((offer) => ({
      id: offer.id,
      title: offer.title,
      companyId: offer.companyId,
    }));
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
    const catalog = await this.repository.catalogSkills();
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
    const job = await this.repository.publishedJob(jobId);
    if (!job) throw new NotFoundException('Vacante no disponible');
    await this.allowedCompany(userId, job.companyId);

    const target = await this.targetFromSkills(job.skills, job.description);
    const applications = await this.applications.applicants(jobId);
    const profiles = await Promise.all(
      applications.map(async (application) => {
        // Sólo se expone a quien autorizó compartir su radar y además tiene un
        // radar publicado. Sin consentimiento o sin radar no hay porcentaje.
        if (!application.consent_to_recruiter) return null;
        const [user, snapshots] = await Promise.all([
          this.repository.candidate(application.user_id),
          this.repository.latestSnapshot(application.user_id),
        ]);
        if (!user) return null;

        const latest = snapshots[0];
        const hasPublishedRadar =
          latest && AREA_IDS.some((areaId) => Number(latest.scores[areaId]) > 0);
        if (!latest || !hasPublishedRadar) return null;

        const comparison = matchRadar(latest.scores, target);
        const sharedContact = recruiterContactProjection(
          application.consent_to_contact,
          user.email,
          user.phone,
        );
        return {
          applicationId: application.id,
          userId: application.user_id,
          name: `${user.firstName} ${user.lastName}`,
          headline: user.headline ?? '',
          email: sharedContact.email,
          phone: sharedContact.phone,
          appliedAt: application.applied_at,
          state: mapApplicationStatus(application.status_title),
          canViewCv: application.consent_to_cv,
          version: latest.version,
          average: Number(latest.average_score),
          scores: latest.scores,
          evidence: latest.evidence ?? {},
          comparison,
          skills: Object.values(latest.evidence ?? {})
            .flat()
            .map((item) => item.name)
            .slice(0, 8),
        };
      }),
    );

    return {
      vacancy: { id: job.id, title: job.title, target },
      applicants: profiles
        .filter((profile): profile is NonNullable<typeof profile> => profile !== null)
        .sort((left, right) => right.comparison.match - left.comparison.match),
    };
  }

  async recruiterAreaEvidence(
    recruiterId: string,
    applicationId: string,
    areaId: string,
  ) {
    if (!AREA_IDS.some((id) => id === areaId)) {
      throw new BadRequestException('Área de afinidad desconocida');
    }

    const applications = await this.applications.companyForEvidence(applicationId);
    const application = applications[0];
    if (!application) {
      throw new NotFoundException('Postulación no disponible para consulta');
    }
    await this.allowedCompany(recruiterId, application.company_id);

    const snapshots = await this.repository.latestSnapshot(application.user_id);
    const publishedSkills = snapshots[0]?.evidence?.[areaId] ?? [];
    const empty = { education: [], certifications: [], experiences: [], tags: [] };
    if (!publishedSkills.length) return empty;

    const ids = publishedSkills.map((item) => item.id);
    const approved = await this.repository.approvedSkillReferences(
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
        if (!ref || typeof ref !== 'object' || !('type' in ref) || !('id' in ref)) {
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
      this.repository.ownedEducation(application.user_id, [
        ...(refs.get('education') ?? []),
      ]),
      this.repository.ownedCertifications(application.user_id, [
        ...(refs.get('certification') ?? []),
      ]),
      this.repository.ownedExperiences(application.user_id, [
        ...(refs.get('work-experience') ?? []),
      ]),
    ]);

    const duration = (start: Date, end: Date | null) => {
      const months = Math.max(
        0,
        Math.round(
          ((end ?? new Date()).getTime() - start.getTime()) /
            (1000 * 60 * 60 * 24 * 30.4375),
        ),
      );
      return months >= 12
        ? `${(months / 12).toLocaleString('es-BO', { maximumFractionDigits: 1 })} año(s)`
        : `${months} mes(es)`;
    };

    return {
      education: education.map((item) => ({
        id: item.id,
        degree: item.degree,
        institution: item.institution,
        year: item.startDate.getUTCFullYear(),
        description: item.description,
      })),
      certifications: certifications.map((item) => ({
        id: item.id,
        name: item.name,
        issuer: item.issuingOrganization,
        year: item.issueDate.getUTCFullYear(),
      })),
      experiences: experiences.map((item) => ({
        id: item.id,
        position: item.position,
        companyName: item.company.title,
        duration: duration(item.startDate, item.endDate),
        description: item.description,
      })),
      tags: [
        ...new Set(
          publishedSkills.filter((item) => allowedIds.has(item.id)).map((item) => item.name),
        ),
      ],
    };
  }

  async recruiterCv(recruiterId: string, applicationId: string) {
    const rows = await this.applications.companyForCv(applicationId);
    const application = rows[0];
    if (!application) throw new NotFoundException('Postulación no encontrada');
    await this.allowedCompany(recruiterId, application.company_id);
    if (!application.consent_to_cv) {
      throw new ForbiddenException('El titular no autorizó compartir su CV');
    }

    const cv = await this.repository.approvedCv(application.user_id);
    if (!cv?.cvPdfUrl) {
      throw new ForbiddenException('No hay CV aprobado autorizado');
    }

    await this.audit(
      application.user_id,
      recruiterId,
      'cv.recruiter_viewed',
      applicationId,
      { applicationId },
    );
    return Buffer.from(cv.cvPdfUrl);
  }

  async decideApplication(recruiterId: string, applicationId: string, decision: string) {
    if (!['hired', 'rejected'].includes(decision)) {
      throw new BadRequestException('Decisión inválida');
    }
    const rows = await this.applications.companyForDecision(applicationId);
    if (!rows.length) throw new NotFoundException('Postulación inexistente');
    await this.allowedCompany(recruiterId, rows[0].company_id);

    const target = decision === 'hired' ? 'Aceptada' : 'No seleccionado';
    const updated = await this.applications.recordRecruiterDecision(applicationId, target);
    if (!updated.length) {
      throw new ConflictException('La postulación ya tiene una decisión o fue retirada');
    }
    await this.audit(rows[0].user_id, recruiterId, `application.${decision}`, applicationId);
    return { id: updated[0].id, state: decision };
  }
}
