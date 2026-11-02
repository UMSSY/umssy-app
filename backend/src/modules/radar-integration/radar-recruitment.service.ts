import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { RadarAccessRepository } from './repositories/radar-access.repository.js';
import { RadarRecruitmentRepository } from './repositories/radar-recruitment.repository.js';
import { JobApplicationsService } from '../matching/services/job-applications.service.js';
import { RadarApplicationsRepository } from './repositories/radar-applications.repository.js';
import { mapApplicationStatus, mapApplicationSummary } from './mappers/radar-applications.mapper.js';
import { DuplicateJobApplicationException } from '../matching/exceptions/duplicate-job-application.exception.js';
import { recruiterContactProjection } from './recruiter-consent.js';
import { AREA_IDS, emptyScores, matchRadar, type Scores } from './radar-scoring.js';





@Injectable()
export class RadarRecruitmentService {
  constructor(
    private readonly repository: RadarRecruitmentRepository,
    private readonly access: RadarAccessRepository,
    private readonly jobApplications: JobApplicationsService,
    private readonly applications: RadarApplicationsRepository,
  ) {}
  private async requireApplicantRole(userId: string): Promise<void> {
    const active = await this.access.hasAnyRole(userId, ['titulado', 'estudiante']);
    if (!active) throw new ForbiddenException('Se requiere rol titulado o estudiante');
  }
  private async requireRole(id:string,role:string):Promise<void>{
    const allowed = await this.access.hasRole(id, role);
    if(!allowed)throw new ForbiddenException(`Se requiere rol ${role}`);
  }
  private async audit(userId:string,actorId:string|null,event:string,targetId:string|null,details:object={}){
    await this.access.recordAudit(userId, actorId, event, targetId, details);
  }
  async grantCompany(adminId:string,userId:string,companyId:string){
    await this.requireRole(adminId,'administrativo');
    await this.requireRole(userId,'empresa');
    if(!await this.repository.companyExists(companyId))throw new NotFoundException('Empresa inexistente');
    await this.repository.grantCompany(userId, companyId);
    return {userId,companyId};
  }
  private async allowedCompany(userId:string,companyId:string){
    await this.requireRole(userId,'empresa');
    const rows = await this.repository.allowedCompany(userId, companyId);
    if(!rows.length)throw new ForbiddenException('Empresa no vinculada a esta sesión');
  }
  async activeVacancies(){
    const jobs = await this.repository.activeVacancies();
    return jobs.map(j=>({id:j.id,companyId:j.companyId,title:j.title,description:j.description}));
  }
  // HU4: el Radar, el CV y el contacto requieren consentimientos independientes.
  // Postularse no obliga a compartir información privada.
  // Ambas vistas reutilizan la misma postulación de Matching/Épica 5.
  async apply(userId:string,jobId:string,consent:boolean,consentCv:boolean,consentContact=false){
    await this.requireApplicantRole(userId);
    const existing=await this.jobApplications.findMine(userId,jobId);
    let application=existing.application;
    if(!application){
      try{application=await this.jobApplications.apply(userId,jobId);}
      catch(error){
        // Otra solicitud podría haber creado la postulación concurrentemente.
        if(!(error instanceof DuplicateJobApplicationException))throw error;
        application=(await this.jobApplications.findMine(userId,jobId)).application;
      }
    }
    if(!application)throw new ConflictException('No se pudo recuperar la postulación');
    if(!['En revisión','Entrevista'].includes(application.status))throw new ConflictException('La postulación ya tiene una decisión o fue retirada');
    const rows = await this.applications.setConsents(application.id, consent, consentCv, consentContact);
    await this.audit(userId,userId,'application.consents_updated',application.id,{consent,consentCv:consent&&consentCv,consentContact:consent&&consentContact});
    return {id:rows[0].id,jobOfferId:jobId,state:mapApplicationStatus(application.status),consent,consentCv:consent&&consentCv,consentContact:consent&&consentContact};
  }
  async myApplications(userId:string){
    await this.requireApplicantRole(userId);
    const rows = await this.applications.myApplications(userId);
    return rows.map(mapApplicationSummary);
  }
  async updateMyApplicationConsents(userId:string,appId:string,consent:boolean,consentCv:boolean,consentContact:boolean){
    await this.requireApplicantRole(userId);
    const rows = await this.applications.updateConsents(userId,appId,consent,consentCv,consentContact);
    if(!rows.length)throw new NotFoundException('Postulación inexistente o retirada');
    await this.audit(userId,userId,'application.consents_updated',appId,{consent,consentCv:consent&&consentCv,consentContact:consent&&consentContact});
    return {id:appId,state:mapApplicationStatus(rows[0].status_title),consent,consentCv:consent&&consentCv,consentContact:consent&&consentContact};
  }
  async withdrawMyApplication(userId:string,appId:string){
    await this.requireApplicantRole(userId);
    const rows = await this.applications.withdraw(userId,appId);
    if(!rows.length)throw new ConflictException('Sólo puedes retirar una postulación en revisión o entrevista');
    await this.audit(userId,userId,'application.withdrawn',appId);
    return {id:rows[0].id,state:'withdrawn'};
  }
    async recruiterVacancies(userId:string){
    await this.requireRole(userId,'empresa');
    const rows = await this.repository.linkedCompanies(userId);
    if(!rows.length)return [];
    const companyIds=rows.map(r=>r.company_id);
    const offers = await this.repository.recruiterVacancies(companyIds);
    return offers.map(o=>({id:o.id,title:o.title,companyId:o.companyId}));
  }
  private async targetFromSkills(skills:{skill:{areaId:string|null;name:string}}[],description:string):Promise<Scores>{
    const result=emptyScores();
    const selected=new Map(skills.map(pair=>[pair.skill.name.toLocaleLowerCase(),pair.skill]));
    // Reglas transparentes de términos del catálogo, no NLP probabilístico.
    const catalog = await this.repository.catalogSkills();
    const text=description.normalize('NFKC').toLocaleLowerCase();
    for(const s of catalog){
      const term=s.name.normalize('NFKC').toLocaleLowerCase();
      if(term.length<3 || selected.has(term))continue;
      const regex=new RegExp(`(^|[^\\p{L}\\p{N}])${term.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}($|[^\\p{L}\\p{N}])`,'u');
      if(regex.test(text))selected.set(term,s);
    }
    for(const s of selected.values()){
      if(AREA_IDS.some(id=>id===s.areaId)){
        const id=s.areaId as keyof Scores;
        result[id]=Math.min(10,result[id]+2.5);
      }
    }
    return result;
  }
  async recruiterApplicants(userId:string,jobId:string){
    const job = await this.repository.publishedJob(jobId);
    if(!job)throw new NotFoundException('Vacante no disponible');
    await this.allowedCompany(userId,job.companyId);
    const target=await this.targetFromSkills(job.skills,job.description);
    const applications = await this.applications.applicants(jobId);
    const profiles=await Promise.all(applications.map(async a=>{
      const [user,snap]=await Promise.all([
        this.repository.candidate(a.user_id),
        a.consent_to_recruiter ? this.repository.latestSnapshot(a.user_id) : Promise.resolve([]),
      ]);
      if(!user)return null;
      const latest=snap[0];
      const authorized=a.consent_to_recruiter&&latest&&AREA_IDS.some(id=>Number(latest.scores[id])>0);
      const comparison=authorized?matchRadar(latest!.scores,target):null;
      const sharedContact=recruiterContactProjection(a.consent_to_recruiter&&a.consent_to_contact,user.email,user.phone);
      return {applicationId:a.id,userId:a.consent_to_recruiter?a.user_id:null,
        name:a.consent_to_recruiter?`${user.firstName} ${user.lastName}`:'Postulante',
        headline:a.consent_to_recruiter?(user.headline??''):'',email:sharedContact.email,phone:sharedContact.phone,
        appliedAt:a.applied_at,state:mapApplicationStatus(a.status_title),canViewCv:a.consent_to_recruiter&&a.consent_to_cv,
        version:authorized?latest!.version:null,average:authorized?Number(latest!.average_score):null,scores:authorized?latest!.scores:null,
        evidence:authorized?latest!.evidence:{},comparison,
        skills:authorized?Object.values(latest!.evidence??{}).flat().map(e=>e.name).slice(0,8):[]};
    }));
    return {vacancy:{id:job.id,title:job.title,target},applicants:profiles.filter((p):p is NonNullable<typeof p>=>p!==null).sort((a,b)=>(b.comparison?.match??-1)-(a.comparison?.match??-1))};
  }
  async recruiterAreaEvidence(recruiterId:string,applicationId:string,areaId:string){
    if(!AREA_IDS.some(id=>id===areaId))throw new BadRequestException('Área de afinidad desconocida');
    const applications = await this.applications.companyForEvidence(applicationId);
    const application=applications[0];
    if(!application)throw new NotFoundException('Postulación no disponible para consulta');
    await this.allowedCompany(recruiterId,application.company_id);
    const snapshots = await this.repository.latestSnapshot(application.user_id);
    const publishedSkills=snapshots[0]?.evidence?.[areaId]??[];
    const empty={education:[],certifications:[],experiences:[],tags:[]};
    if(!publishedSkills.length)return empty;
    const ids=publishedSkills.map(x=>x.id);
    const approved = await this.repository.approvedSkillReferences(application.user_id, ids);
    const allowedIds=new Set(approved.map(x=>x.skillId));
    const refs=new Map<string,Set<string>>([
      ['education',new Set<string>()],['certification',new Set<string>()],['work-experience',new Set<string>()],
    ]);
    for(const row of approved){
      if(!Array.isArray(row.evidenceRefs))continue;
      for(const ref of row.evidenceRefs){
        if(!ref||typeof ref!=='object'||!('type' in ref)||!('id' in ref))continue;
        const type=ref.type;const id=ref.id;
        if(typeof type==='string'&&typeof id==='string')refs.get(type)?.add(id);
      }
    }
    const [education,certifications,experiences]=await Promise.all([
      this.repository.ownedEducation(application.user_id, [...(refs.get('education') ?? [])]),
      this.repository.ownedCertifications(application.user_id, [...(refs.get('certification') ?? [])]),
      this.repository.ownedExperiences(application.user_id, [...(refs.get('work-experience') ?? [])]),
    ]);
    const duration=(start:Date,end:Date|null)=>{
      const months=Math.max(0,Math.round(((end??new Date()).getTime()-start.getTime())/(1000*60*60*24*30.4375)));
      return months>=12?`${(months/12).toLocaleString('es-BO',{maximumFractionDigits:1})} año(s)`:`${months} mes(es)`;
    };
    return {
      education:education.map(e=>({id:e.id,degree:e.degree,institution:e.institution,year:e.startDate.getUTCFullYear(),description:e.description})),
      certifications:certifications.map(c=>({id:c.id,name:c.name,issuer:c.issuingOrganization,year:c.issueDate.getUTCFullYear()})),
      experiences:experiences.map(e=>({id:e.id,position:e.position,companyName:e.company.title,duration:duration(e.startDate,e.endDate),description:e.description})),
      tags:[...new Set(publishedSkills.filter(x=>allowedIds.has(x.id)).map(x=>x.name))],
    };
  }
  async recruiterCv(recruiterId:string,applicationId:string){
    const apps = await this.applications.companyForCv(applicationId);
    const app=apps[0];
    if(!app)throw new NotFoundException('Postulación no encontrada');
    await this.allowedCompany(recruiterId,app.company_id);
    if(!app.consent_to_cv)throw new ForbiddenException('El titular no autorizó compartir su CV');
    const approved = await this.repository.approvedCv(app.user_id);
    if(!approved.length)throw new ForbiddenException('No hay CV aprobado autorizado');
    const cv = await this.repository.cvBytes(approved[0].cv_id);
    if(!cv?.cvPdfData)throw new NotFoundException('Archivo no encontrado');
    await this.audit(app.user_id,recruiterId,'cv.recruiter_viewed',approved[0].cv_id,{applicationId});
    return Buffer.from(cv.cvPdfData,'base64');
  }
  async decideApplication(recruiterId:string,appId:string,decision:string){
    if(!['hired','rejected'].includes(decision))throw new BadRequestException('Decisión inválida');
    const rows = await this.applications.companyForDecision(appId);
    if(!rows.length)throw new NotFoundException('Postulación inexistente');
    await this.allowedCompany(recruiterId,rows[0].company_id);
    const target=decision==='hired'?'Aceptada':'No seleccionado';
    const updated = await this.applications.recordRecruiterDecision(appId,target);
    if(!updated.length)throw new ConflictException('La postulación ya tiene una decisión o fue retirada');
    await this.audit(rows[0].user_id,recruiterId,`application.${decision}`,appId);
    return {id:updated[0].id,state:decision};
  }

}
