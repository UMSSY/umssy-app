import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { ProfileSkillsEvents, type ProfileSkillsPublished } from '../../common/profile-skills/profile-skills-events.service.js';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { ProfileSkillsAnalysisService } from '../nlp/services/profile-skills-analysis.service.js';
import { recruiterContactProjection } from './recruiter-consent.js';
import { AREA_IDS, emptyScores, matchRadar, RUBRIC_VERSION, scoreVerifiedSkills, type Scores } from './radar-scoring.js';

type CvReview = { cv_id:string;user_id:string;extraction_status:string;review_status:string;submitted_at:Date;cv_file_name:string|null;extracted_chars:number };
type PublishedSkill = {id:string;name:string;areaId:string|null;isHighRelevance:boolean;evidenceRefs:{type:string;id:string}[]};
type SnapshotRow = { user_id:string;version:number;rubric_version:string;fingerprint:string;scores:Scores;evidence:Record<string,{id:string;name:string}[]>;average_score:string|number;created_at:Date;source_revision:number|null;skills:PublishedSkill[] };
type ApplicationRow = {id:string;job_offer_id:string;user_id:string;state:string;applied_at:Date;consent_to_recruiter:boolean;consent_to_cv:boolean;consent_to_contact:boolean};

@Injectable()
export class RadarIntegrationService implements OnModuleInit, OnModuleDestroy {
  private unsubscribe?: () => void;
  constructor(private readonly prisma:PrismaService,private readonly nlp:ProfileSkillsAnalysisService,private readonly events:ProfileSkillsEvents){}

  onModuleInit():void {
    this.unsubscribe=this.events.subscribe(publication=>this.recalculate(publication.userId,null,publication).then(()=>undefined));
  }

  onModuleDestroy():void { this.unsubscribe?.(); }

  async retry(userId:string){
    const analysis=await this.nlp.analyzeNow(userId);
    if(analysis.status!=='ready')throw new ConflictException('El análisis sigue pendiente o falló; puedes reintentarlo.');
    // Also supports callers that run before the module lifecycle has subscribed.
    await this.recalculate(userId,userId);
    return this.myRadar(userId);
  }

  private async requireRole(id:string,role:string):Promise<void>{
    const match=await this.prisma.userRole.findFirst({where:{userId:id,deletedAt:null,role:{name:role}},select:{id:true}});
    if(!match)throw new ForbiddenException(`Se requiere rol ${role}`);
  }
  private async audit(userId:string,actorId:string|null,event:string,targetId:string|null,details:object={}){
    await this.prisma.$executeRaw`INSERT INTO radar_audit_events (user_id,actor_id,event_type,target_id,details) VALUES (${userId}::uuid,${actorId}::uuid,${event},${targetId}::uuid,${JSON.stringify(details)}::jsonb)`;
  }
  // Se llama solo después de que la carga original de CV haya sido guardada por Épica 2.
  // La extracción NO aprueba automáticamente ningún documento ni habilidad.
  // Se invoca al guardar un CV nuevo o al reprocesar uno historico.
  // Reprocesar jamas revoca silenciosamente una decision administrativa anterior.
  async ingestCv(userId:string,cvId:string,buffer:Buffer,reprocess=false){    
    let extractedText = '';
    let extractionStatus = 'unreadable';

    try {
      const mupdf = await import('mupdf');

      const document = mupdf.Document.openDocument(
        new Uint8Array(buffer),
        'application/pdf',
      );

      try {
        const contents: string[] = [];
        const pageCount = Math.min(document.countPages(), 40);

        for (let pageNumber = 0; pageNumber < pageCount; pageNumber++) {
          const page = document.loadPage(pageNumber);

          try {
            const structuredText = page.toStructuredText('');

            try {
              contents.push(structuredText.asText());
            } finally {
              structuredText.destroy();
            }
          } finally {
            page.destroy();
          }
        }

        extractedText = contents.join('\n').slice(0, 20_000);
        extractionStatus = extractedText.trim()
          ? 'ready'
          : 'unreadable';
      } finally {
        document.destroy();
      }
    } catch {
      extractionStatus = 'error';
    }
    const rows=await this.prisma.$queryRaw<{review_status:string}[]>`
      INSERT INTO radar_cv_evidence (cv_id,user_id,extracted_text,extraction_status,review_status)
      VALUES (${cvId}::uuid,${userId}::uuid,${extractedText},${extractionStatus},'pending')
      ON CONFLICT (cv_id) DO UPDATE SET
        extracted_text=EXCLUDED.extracted_text,
        extraction_status=EXCLUDED.extraction_status
      WHERE radar_cv_evidence.user_id=EXCLUDED.user_id
      RETURNING review_status`;
    if(!rows.length)throw new ForbiddenException('El CV no pertenece al titular');
    await this.audit(userId,null,reprocess?'cv.reprocessed':'cv.submitted',cvId,{extractionStatus,textCharacters:extractedText.length});
    // El analisis genera detecciones pendientes, nunca aprobaciones automaticas.
    await this.nlp.refreshAfterChange(userId);
    await this.recalculate(userId,null);
    const nlp=await this.nlp.getRadarSnapshot(userId);
    return {cvId,extractionStatus,extractedCharacters:extractedText.length,reviewStatus:rows[0].review_status,nlpStatus:nlp.status};
  }
  async rescanCurrentCv(userId:string){
    const cv=await this.prisma.userCvFile.findFirst({where:{userId},orderBy:{cvUploadedAt:'desc'},select:{id:true,cvPdfData:true}});
    if(!cv?.cvPdfData)throw new NotFoundException('No hay CV vigente para analizar');
    return this.ingestCv(userId,cv.id,Buffer.from(cv.cvPdfData,'base64'),true);
  }
  async reprocessCv(adminId:string,cvId:string){
    await this.requireRole(adminId,'administrativo');
    const cv=await this.prisma.userCvFile.findUnique({where:{id:cvId},select:{id:true,userId:true,cvPdfData:true}});
    if(!cv?.cvPdfData)throw new NotFoundException('CV inexistente o sin archivo');
    const result=await this.ingestCv(cv.userId,cvId,Buffer.from(cv.cvPdfData,'base64'),true);
    await this.audit(cv.userId,adminId,'cv.admin_reprocessed',cvId,{extractionStatus:result.extractionStatus});
    return result;
  }
  async cvRemoved(userId:string,cvId:string){
    await this.audit(userId,userId,'cv.removed',cvId);
    await this.nlp.refreshAfterChange(userId);
    await this.recalculate(userId,userId);
  }
  // Inmutable e idempotente por titular; no se publica un snapshot parcial.
  async recalculate(userId:string,actorId:string|null,publication?:ProfileSkillsPublished){
    let revision=publication?.inputRevision??0;
    let attemptStartedAt=new Date();
    try{
      return await this.prisma.$transaction(async tx=>{
        const lock=await tx.$queryRaw<{ locked:number;started_at:Date }[]>`SELECT 1 AS locked,clock_timestamp() AS started_at FROM pg_advisory_xact_lock(hashtext(${userId}))`;
        attemptStartedAt=lock[0]?.started_at??attemptStartedAt;
        // Lock the source state so a new publication cannot interleave with this snapshot.
        const states=await tx.$queryRaw<{input_revision:number;processed_revision:number|null;status:string}[]>`
          SELECT input_revision,processed_revision,status FROM profile_skill_processing_states
          WHERE user_id=${userId}::uuid FOR SHARE`;
        const state=states[0];
        revision=state?.input_revision??0;
        if(state&&(state.status!=='ready'||state.processed_revision!==revision)){
          throw new ConflictException('El análisis del perfil aún no está actualizado.');
        }
        if(publication&&publication.inputRevision!==revision)return null;
        const [rows,docs,experiences,educations,certifications]=await Promise.all([
          tx.userSkill.findMany({where:{userId,verificationStatus:'approved'},select:{skillId:true,source:true,isHighRelevance:true,evidenceRefs:true,skill:{select:{name:true,areaId:true}}}}),
          tx.$queryRaw<{cv_id:string;review_status:string;extraction_status:string}[]>`SELECT cv_id,review_status,extraction_status FROM radar_cv_evidence WHERE user_id=${userId}::uuid`,
          tx.workExperience.findMany({where:{userId},select:{id:true}}),
          tx.education.findMany({where:{userId},select:{id:true}}),
          tx.certification.findMany({where:{userId,documentUrl:{not:null}},select:{id:true}}),
        ]);
        const cvApproved=new Set(docs.filter(d=>d.review_status==='approved'&&d.extraction_status==='ready').map(d=>d.cv_id));
        const living:Record<string,Set<string>>={
          'work-experience':new Set(experiences.map(x=>x.id)),
          'education':new Set(educations.map(x=>x.id)),
          'certification':new Set(certifications.map(x=>x.id)),
          'cv':cvApproved,
        };
        const accepted=rows.flatMap(r=>{
          const refs=Array.isArray(r.evidenceRefs)?r.evidenceRefs:[];
          const valid=refs.flatMap(entry=>{
            if(!entry || typeof entry!=='object' || !('type' in entry) || !('id' in entry))return [];
            const type=entry.type;const id=entry.id;
            if(typeof type!=='string'||typeof id!=='string'||!living[type]?.has(id))return [];
            return [{type,id}];
          }).sort((a,b)=>`${a.type}:${a.id}`.localeCompare(`${b.type}:${b.id}`));
          if(r.source==='nlp'&&!valid.length)return [];
          if(!AREA_IDS.some(id=>id===r.skill.areaId))return [];
          return [{id:r.skillId,name:r.skill.name,areaId:r.skill.areaId,isHighRelevance:r.isHighRelevance&&valid.length>0,evidenceRefs:valid}];
        });
        const calculated=scoreVerifiedSkills(accepted);
        const last=await this.storedSnapshots(tx,userId,1);
        if(last[0]?.fingerprint===calculated.fingerprint){
          await tx.$executeRaw`INSERT INTO radar_audit_events (user_id,actor_id,event_type,details,occurred_at)
            VALUES (${userId}::uuid,${actorId}::uuid,'radar.synchronized',${JSON.stringify({version:last[0].version,sourceRevision:revision,skills:accepted})}::jsonb,clock_timestamp())`;
          return this.snapshotResponse({...last[0],source_revision:revision,skills:accepted});
        }
        const version=(last[0]?.version??0)+1;
        const inserted=await tx.$queryRaw<SnapshotRow[]>`INSERT INTO radar_score_snapshots (user_id,version,rubric_version,fingerprint,scores,evidence,average_score)
          VALUES (${userId}::uuid,${version},${RUBRIC_VERSION},${calculated.fingerprint},${JSON.stringify(calculated.scores)}::jsonb,${JSON.stringify(calculated.evidence)}::jsonb,${calculated.average}) RETURNING *`;
        await tx.$executeRaw`INSERT INTO radar_audit_events (user_id,actor_id,event_type,details,occurred_at) VALUES (${userId}::uuid,${actorId}::uuid,'radar.published',${JSON.stringify({version,rubric:RUBRIC_VERSION,sourceRevision:revision,skills:accepted})}::jsonb,clock_timestamp())`;
        return this.snapshotResponse({...inserted[0],source_revision:revision,skills:accepted},last[0]);
      });
    }catch(error){
      // La transaccion descarta el resultado fallido; el registro se intenta por separado.
      try{
        await this.prisma.$executeRaw`INSERT INTO radar_audit_events (user_id,actor_id,event_type,details,occurred_at)
          SELECT ${userId}::uuid,${actorId}::uuid,'radar.recalculation_failed',${JSON.stringify({revision})}::jsonb,clock_timestamp()
          WHERE NOT EXISTS (SELECT 1 FROM radar_audit_events WHERE user_id=${userId}::uuid
            AND event_type IN ('radar.published','radar.synchronized')
            AND (details->>'sourceRevision')::integer>=${revision} AND occurred_at>=${attemptStartedAt}::timestamptz)`;
      }catch{}
      throw error;
    }
  }
  private storedSnapshots(client:Pick<PrismaService,'$queryRaw'>,userId:string,limit:number){
    return client.$queryRaw<SnapshotRow[]>`
      SELECT s.*,(a.details->>'sourceRevision')::integer AS source_revision,COALESCE(a.details->'skills','[]'::jsonb) AS skills
      FROM radar_score_snapshots s
      LEFT JOIN LATERAL (SELECT details FROM radar_audit_events WHERE user_id=s.user_id
        AND event_type IN ('radar.published','radar.synchronized') AND details->>'version'=s.version::text
        AND details ? 'skills' ORDER BY occurred_at DESC,id DESC LIMIT 1) a ON TRUE
      WHERE s.user_id=${userId}::uuid ORDER BY s.version DESC LIMIT ${limit}`;
  }
  private snapshotResponse(row:SnapshotRow,previous?:SnapshotRow){return {userId:row.user_id,status:'published' as const,version:row.version,sourceRevision:row.source_revision,rubricVersion:row.rubric_version,updatedAt:row.created_at,scores:row.scores,average:Number(row.average_score),variation:previous?Number((Number(row.average_score)-Number(previous.average_score)).toFixed(2)):null,evidence:row.evidence,skills:row.skills};}
  async myRadar(userId:string){
    const [rows,pendingDocs,pendingSkills,states,attempts]=await Promise.all([
      this.storedSnapshots(this.prisma,userId,2),
      this.prisma.$queryRaw<{count:bigint}[]>`SELECT COUNT(*)::bigint AS count FROM radar_cv_evidence WHERE user_id=${userId}::uuid AND review_status='pending'`,
      this.prisma.userSkill.count({where:{userId,verificationStatus:'pending'}}),
      this.prisma.profileSkillProcessingState.findUnique({where:{userId},select:{status:true,inputRevision:true,processedRevision:true,dictionaryVersion:true}}),
      this.prisma.$queryRaw<{source_revision:number|null;status:string}[]>`
        SELECT COALESCE((details->>'sourceRevision')::integer,(details->>'revision')::integer) AS source_revision,
          CASE WHEN event_type='radar.recalculation_failed' THEN 'error' ELSE 'ready' END AS status
        FROM radar_audit_events WHERE user_id=${userId}::uuid
          AND event_type IN ('radar.published','radar.synchronized','radar.recalculation_failed')
        ORDER BY occurred_at DESC,id DESC LIMIT 1`,
    ]);
    const last=rows[0];const prev=rows[1];const p=Number(pendingDocs[0]?.count??0)+pendingSkills;
    const sourceRevision=states?.inputRevision??0;
    const failed=states?.status==='error'||(attempts[0]?.status==='error'&&attempts[0].source_revision===sourceRevision);
    const updating=(!!last&&last.source_revision===null)||(!!states&&(states.status!=='ready'||states.processedRevision!==sourceRevision||last?.source_revision!==sourceRevision));
    return { ...(last?this.snapshotResponse(last,prev):{userId,status:'empty',version:0,sourceRevision:null,rubricVersion:RUBRIC_VERSION,updatedAt:null,scores:emptyScores(),average:0,variation:null,evidence:Object.fromEntries(AREA_IDS.map(id=>[id,[]])),skills:[]}),pending:p,hasPending:p>0,processingStatus:failed?'error':updating?'pending':'ready',inputRevision:sourceRevision,dictionaryVersion:states?.dictionaryVersion??null};
  }
  async queue(adminId:string){
    await this.requireRole(adminId,'administrativo');
    const [documents,skills]=await Promise.all([
      this.prisma.$queryRaw<(CvReview&{name:string})[]>`SELECT e.cv_id,e.user_id,e.extraction_status,e.review_status,e.submitted_at,CHAR_LENGTH(e.extracted_text) AS extracted_chars,c.cv_file_name,(u.first_name||' '||u.last_name) AS name FROM radar_cv_evidence e JOIN users u ON u.id=e.user_id JOIN user_cv_file c ON c.id=e.cv_id ORDER BY e.submitted_at DESC LIMIT 300`,
      this.prisma.userSkill.findMany({where:{verificationStatus:{in:['pending','approved','rejected','revoked']}},include:{skill:true,user:{select:{firstName:true,lastName:true}}},take:300,orderBy:{createdAt:'desc'}}),
    ]);
    return [...documents.map(d=>({id:`cv:${d.cv_id}`,userId:d.user_id,userName:d.name,type:'cv',title:d.cv_file_name??'CV PDF',status:d.review_status,extractionStatus:d.extraction_status,extractedCharacters:d.extracted_chars,date:d.submitted_at})),...skills.map(s=>({id:`skill:${s.id}`,userId:s.userId,userName:`${s.user.firstName} ${s.user.lastName}`,type:'skill',title:s.skill.name,status:s.verificationStatus,date:s.createdAt,areaId:s.skill.areaId,evidenceRefs:s.evidenceRefs}))].sort((a,b)=>new Date(b.date).getTime()-new Date(a.date).getTime());
  }
  async decision(adminId:string,kind:string,id:string,action:string){
    await this.requireRole(adminId,'administrativo');
    if(!['approved','rejected','revoked'].includes(action))throw new BadRequestException('Decisión inválida');
    if(kind==='cv'){
      const rows=await this.prisma.$queryRaw<{user_id:string;review_status:string}[]>`UPDATE radar_cv_evidence SET review_status=${action},reviewer_id=${adminId}::uuid,decided_at=now() WHERE cv_id=${id}::uuid AND review_status<>${action} RETURNING user_id,review_status`;
      if(!rows.length){
        const existing=await this.prisma.$queryRaw<{user_id:string}[]>`SELECT user_id FROM radar_cv_evidence WHERE cv_id=${id}::uuid`;
        if(!existing.length)throw new NotFoundException('CV inexistente');
        return this.recalculateAfterDecision(existing[0].user_id,adminId);
      }
      await this.audit(rows[0].user_id,adminId,`cv.${action}`,id);
      await this.nlp.refreshAfterChange(rows[0].user_id);
      return this.recalculateAfterDecision(rows[0].user_id,adminId);
    }
    if(kind==='skill'){
      const old=await this.prisma.userSkill.findUnique({where:{id},select:{userId:true,verificationStatus:true}});
      if(!old)throw new NotFoundException('Habilidad no encontrada');
      const changed=await this.prisma.userSkill.updateMany({where:{id,verificationStatus:{not:action}},data:{verificationStatus:action}});
      if(changed.count)await this.audit(old.userId,adminId,`skill.${action}`,id);
      return this.recalculateAfterDecision(old.userId,adminId);
    }
    throw new BadRequestException('Tipo de evidencia desconocido');
  }
  private async recalculateAfterDecision(userId:string,actorId:string){
    try{await this.recalculate(userId,actorId);}catch{
      // The decision is already saved. Report the recoverable processing state
      // instead of telling the reviewer that their decision was not saved.
    }
    return this.myRadar(userId);
  }
  async downloadForAdmin(adminId:string,cvId:string){
    await this.requireRole(adminId,'administrativo');
    const rows=await this.prisma.userCvFile.findFirst({where:{id:cvId},select:{userId:true,cvPdfData:true,cvFileName:true}});
    if(!rows?.cvPdfData)throw new NotFoundException('Archivo no encontrado');
    await this.audit(rows.userId,adminId,'cv.viewed',cvId);
    return {filename:rows.cvFileName??'curriculum.pdf',buffer:Buffer.from(rows.cvPdfData,'base64')};
  }
  async grantCompany(adminId:string,userId:string,companyId:string){
    await this.requireRole(adminId,'administrativo');
    await this.requireRole(userId,'empresa');
    if(!await this.prisma.company.findUnique({where:{id:companyId},select:{id:true}}))throw new NotFoundException('Empresa inexistente');
    await this.prisma.$executeRaw`INSERT INTO radar_company_access (company_id,user_id) VALUES (${companyId}::uuid,${userId}::uuid) ON CONFLICT DO NOTHING`;
    return {userId,companyId};
  }
  private async allowedCompany(userId:string,companyId:string){
    await this.requireRole(userId,'empresa');
    const rows=await this.prisma.$queryRaw<{company_id:string}[]>`SELECT company_id FROM radar_company_access WHERE company_id=${companyId}::uuid AND user_id=${userId}::uuid`;
    if(!rows.length)throw new ForbiddenException('Empresa no vinculada a esta sesión');
  }
  async activeVacancies(){
    const jobs=await this.prisma.jobOffer.findMany({where:{status:{title:'Publicada'},OR:[{expiresAt:null},{expiresAt:{gt:new Date()}}]},include:{skills:{include:{skill:true}}},orderBy:{createdAt:'desc'}});
    return jobs.map(j=>({id:j.id,companyId:j.companyId,title:j.title,description:j.description}));
  }
  // HU4: tres decisiones informadas. La visibilidad del radar es obligatoria para postular;
  // el acceso al teléfono/correo y al PDF son optativos e independientes.
  async apply(userId:string,jobId:string,consent:boolean,consentCv:boolean,consentContact=false){
    if(!consent)throw new BadRequestException('Debes autorizar el resumen del radar para postularte');
    await this.requireRole(userId,'titulado');
    const job=await this.prisma.jobOffer.findFirst({where:{id:jobId,status:{title:'Publicada'},OR:[{expiresAt:null},{expiresAt:{gt:new Date()}}]},select:{id:true}});
    if(!job)throw new NotFoundException('Vacante no disponible');
    const rows=await this.prisma.$queryRaw<ApplicationRow[]>`
      INSERT INTO radar_job_applications (job_offer_id,user_id,consent_to_recruiter,consent_to_cv,consent_to_contact)
      VALUES (${jobId}::uuid,${userId}::uuid,TRUE,${consentCv},${consentContact})
      ON CONFLICT (job_offer_id,user_id) DO UPDATE
      SET consent_to_recruiter=TRUE,consent_to_cv=EXCLUDED.consent_to_cv,consent_to_contact=EXCLUDED.consent_to_contact
      WHERE radar_job_applications.state='applied'
      RETURNING *`;
    if(!rows.length)throw new ConflictException('Esta postulación ya tiene una decisión o fue retirada');
    await this.audit(userId,userId,'application.submitted',rows[0].id,{jobId,consentCv,consentContact});
    return {id:rows[0].id,state:rows[0].state,jobOfferId:jobId,consent:true,consentCv,consentContact};
  }
  async myApplications(userId:string){
    await this.requireRole(userId,'titulado');
    const rows=await this.prisma.$queryRaw<ApplicationRow[]>`
      SELECT a.id,a.job_offer_id,a.user_id,a.state,a.applied_at,a.consent_to_recruiter,a.consent_to_cv,a.consent_to_contact
      FROM radar_job_applications a WHERE a.user_id=${userId}::uuid ORDER BY a.applied_at DESC`;
    return rows.map(row=>({id:row.id,jobOfferId:row.job_offer_id,state:row.state,appliedAt:row.applied_at,
      consent:row.consent_to_recruiter,consentCv:row.consent_to_cv,consentContact:row.consent_to_contact}));
  }
  async updateMyApplicationConsents(userId:string,appId:string,consent:boolean,consentCv:boolean,consentContact:boolean){
    await this.requireRole(userId,'titulado');
    const rows=await this.prisma.$queryRaw<ApplicationRow[]>`
      UPDATE radar_job_applications
      SET consent_to_recruiter=${consent},consent_to_cv=${consent&&consentCv},consent_to_contact=${consent&&consentContact}
      WHERE id=${appId}::uuid AND user_id=${userId}::uuid AND state<>'withdrawn' RETURNING *`;
    if(!rows.length)throw new NotFoundException('Postulación inexistente o retirada');
    await this.audit(userId,userId,'application.consents_updated',appId,{consent,consentCv:consent&&consentCv,consentContact:consent&&consentContact});
    return {id:rows[0].id,state:rows[0].state,consent:rows[0].consent_to_recruiter,consentCv:rows[0].consent_to_cv,consentContact:rows[0].consent_to_contact};
  }
  async withdrawMyApplication(userId:string,appId:string){
    await this.requireRole(userId,'titulado');
    const rows=await this.prisma.$queryRaw<ApplicationRow[]>`
      UPDATE radar_job_applications SET state='withdrawn',consent_to_recruiter=FALSE,consent_to_cv=FALSE,consent_to_contact=FALSE
      WHERE id=${appId}::uuid AND user_id=${userId}::uuid AND state='applied' RETURNING *`;
    if(!rows.length)throw new NotFoundException('Postulación no encontrada o ya decidida');
    await this.audit(userId,userId,'application.withdrawn',appId);
    return {id:rows[0].id,state:rows[0].state};
  }
    async recruiterVacancies(userId:string){
    await this.requireRole(userId,'empresa');
    const rows=await this.prisma.$queryRaw<{company_id:string}[]>`SELECT company_id FROM radar_company_access WHERE user_id=${userId}::uuid`;
    if(!rows.length)return [];
    const companyIds=rows.map(r=>r.company_id);
    const offers=await this.prisma.jobOffer.findMany({where:{companyId:{in:companyIds},status:{title:'Publicada'},OR:[{expiresAt:null},{expiresAt:{gt:new Date()}}]},include:{skills:{include:{skill:true}}},orderBy:{createdAt:'desc'}});
    return offers.map(o=>({id:o.id,title:o.title,companyId:o.companyId}));
  }
  private async targetFromSkills(skills:{skill:{areaId:string|null;name:string}}[],description:string):Promise<Scores>{
    const result=emptyScores();
    const selected=new Map(skills.map(pair=>[pair.skill.name.toLocaleLowerCase(),pair.skill]));
    // Reglas transparentes de términos del catálogo, no NLP probabilístico.
    const catalog=await this.prisma.skill.findMany({where:{isCustom:false,areaId:{not:null}},select:{name:true,areaId:true}});
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
    const job=await this.prisma.jobOffer.findFirst({where:{id:jobId,status:{title:'Publicada'},OR:[{expiresAt:null},{expiresAt:{gt:new Date()}}]},include:{skills:{include:{skill:true}}}});
    if(!job)throw new NotFoundException('Vacante no disponible');
    await this.allowedCompany(userId,job.companyId);
    const target=await this.targetFromSkills(job.skills,job.description);
    const applications=await this.prisma.$queryRaw<ApplicationRow[]>`
      SELECT * FROM radar_job_applications
      WHERE job_offer_id=${jobId}::uuid AND consent_to_recruiter=TRUE AND state<>'withdrawn' ORDER BY applied_at DESC`;
    const profiles=await Promise.all(applications.map(async a=>{
      const [user,snap]=await Promise.all([
        this.prisma.user.findUnique({where:{id:a.user_id},select:{firstName:true,lastName:true,headline:true,email:true,phone:true}}),
        this.prisma.$queryRaw<SnapshotRow[]>`SELECT * FROM radar_score_snapshots WHERE user_id=${a.user_id}::uuid ORDER BY version DESC LIMIT 1`,
      ]);
      const latest=snap[0];
      // HU4 AC2/AC4: sin radar publicado con competencias no se ofrece compatibilidad ficticia.
      if(!user||!latest||!AREA_IDS.some(id=>Number(latest.scores[id])>0))return null;
      const comparison=matchRadar(latest.scores,target);
      const sharedContact=recruiterContactProjection(a.consent_to_contact,user.email,user.phone);
      return {applicationId:a.id,userId:a.user_id,name:`${user.firstName} ${user.lastName}`,
        headline:user.headline??'',email:sharedContact.email,
        phone:sharedContact.phone,
        appliedAt:a.applied_at,state:a.state,canViewCv:a.consent_to_cv,version:latest.version,
        scores:latest.scores,evidence:latest.evidence,comparison,
        skills:Object.values(latest.evidence??{}).flat().map(e=>e.name).slice(0,8)};
    }));
    return {vacancy:{id:job.id,title:job.title,target},applicants:profiles.filter((p):p is NonNullable<typeof p>=>p!==null).sort((a,b)=>b.comparison.match-a.comparison.match)};
  }
  // Solo se devuelven metadatos documentales referenciados por habilidades aprobadas
  // de la instantánea publicada. Nunca se devuelve el PDF ni texto integral del CV.
  async recruiterAreaEvidence(recruiterId:string,applicationId:string,areaId:string){
    if(!AREA_IDS.some(id=>id===areaId))throw new BadRequestException('Área de afinidad desconocida');
    const applications=await this.prisma.$queryRaw<{user_id:string;company_id:string}[]>`
      SELECT a.user_id,j.company_id FROM radar_job_applications a
      JOIN job_offers j ON j.id=a.job_offer_id
      WHERE a.id=${applicationId}::uuid AND a.consent_to_recruiter=TRUE AND a.state<>'withdrawn'`;
    const application=applications[0];
    if(!application)throw new NotFoundException('Postulación no disponible para consulta');
    await this.allowedCompany(recruiterId,application.company_id);
    const snapshots=await this.prisma.$queryRaw<SnapshotRow[]>`
      SELECT * FROM radar_score_snapshots WHERE user_id=${application.user_id}::uuid
      ORDER BY version DESC LIMIT 1`;
    const publishedSkills=snapshots[0]?.evidence?.[areaId]??[];
    const empty={education:[],certifications:[],experiences:[],tags:[]};
    if(!publishedSkills.length)return empty;
    const ids=publishedSkills.map(x=>x.id);
    const approved=await this.prisma.userSkill.findMany({
      where:{userId:application.user_id,verificationStatus:'approved',skillId:{in:ids}},
      select:{skillId:true,evidenceRefs:true},
    });
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
      this.prisma.education.findMany({
        where:{userId:application.user_id,id:{in:[...(refs.get('education')??[])]}},
        select:{id:true,degree:true,institution:true,startDate:true,description:true},
      }),
      this.prisma.certification.findMany({
        where:{userId:application.user_id,id:{in:[...(refs.get('certification')??[])]}},
        select:{id:true,name:true,issuingOrganization:true,issueDate:true},
      }),
      this.prisma.workExperience.findMany({
        where:{userId:application.user_id,id:{in:[...(refs.get('work-experience')??[])]}},
        select:{id:true,position:true,startDate:true,endDate:true,description:true,company:{select:{title:true}}},
      }),
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
    private async hasCvConsent(appId:string):Promise<boolean>{
    const rows=await this.prisma.$queryRaw<{consent_to_cv:boolean}[]>`SELECT consent_to_cv FROM radar_job_applications WHERE id=${appId}::uuid`;
    return !!rows[0]?.consent_to_cv;
  }
  async recruiterCv(recruiterId:string,applicationId:string){
    const apps=await this.prisma.$queryRaw<{user_id:string;company_id:string;consent_to_cv:boolean}[]>`
      SELECT a.user_id,j.company_id,a.consent_to_cv FROM radar_job_applications a
      JOIN job_offers j ON j.id=a.job_offer_id
      WHERE a.id=${applicationId}::uuid AND a.consent_to_recruiter=TRUE AND a.state<>'withdrawn'`;
    const app=apps[0];
    if(!app)throw new NotFoundException('Postulación no encontrada');
    await this.allowedCompany(recruiterId,app.company_id);
    if(!app.consent_to_cv)throw new ForbiddenException('El titular no autorizó compartir su CV');
    const approved=await this.prisma.$queryRaw<{cv_id:string}[]>`
      SELECT e.cv_id FROM radar_cv_evidence e JOIN user_cv_file c ON c.id=e.cv_id
      WHERE e.user_id=${app.user_id}::uuid AND e.review_status='approved'
      ORDER BY c.cv_uploaded_at DESC NULLS LAST LIMIT 1`;
    if(!approved.length)throw new ForbiddenException('No hay CV aprobado autorizado');
    const cv=await this.prisma.userCvFile.findUnique({where:{id:approved[0].cv_id},select:{cvPdfData:true}});
    if(!cv?.cvPdfData)throw new NotFoundException('Archivo no encontrado');
    await this.audit(app.user_id,recruiterId,'cv.recruiter_viewed',approved[0].cv_id,{applicationId});
    return Buffer.from(cv.cvPdfData,'base64');
  }
    async decideApplication(recruiterId:string,appId:string,decision:string){
    if(!['hired','rejected'].includes(decision))throw new BadRequestException('Decisión inválida');
    const rows=await this.prisma.$queryRaw<{user_id:string;company_id:string}[]>`SELECT a.user_id,j.company_id FROM radar_job_applications a JOIN job_offers j ON j.id=a.job_offer_id WHERE a.id=${appId}::uuid`;
    if(!rows.length)throw new NotFoundException('Postulación inexistente');
    await this.allowedCompany(recruiterId,rows[0].company_id);
    const updated=await this.prisma.$queryRaw<ApplicationRow[]>`UPDATE radar_job_applications SET state=${decision},decided_at=now(),decided_by=${recruiterId}::uuid WHERE id=${appId}::uuid AND state='applied' RETURNING *`;
    if(!updated.length)throw new BadRequestException('La postulación ya tiene una decisión');
    await this.audit(rows[0].user_id,recruiterId,`application.${decision}`,appId);
    return {id:updated[0].id,state:updated[0].state};
  }
}
