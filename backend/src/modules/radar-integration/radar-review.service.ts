import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { RadarReviewRepository } from './repositories/radar-review.repository.js';
import { RadarAccessRepository } from './repositories/radar-access.repository.js';
import { ProfileSkillsAnalysisService } from '../nlp/services/profile-skills-analysis.service.js';
import { RadarPublicationService } from './radar-publication.service.js';


@Injectable()
export class RadarReviewService {
  constructor(private readonly repository: RadarReviewRepository, private readonly access: RadarAccessRepository, private readonly nlp: ProfileSkillsAnalysisService, private readonly publication: RadarPublicationService) {}
  private async requireRole(id:string,role:string):Promise<void>{
    const allowed = await this.access.hasRole(id, role);
    if (!allowed)throw new ForbiddenException(`Se requiere rol ${role}`);
  }
  private async audit(userId:string,actorId:string|null,event:string,targetId:string|null,details:object={}){
    await this.access.recordAudit(userId, actorId, event, targetId, details);
  }
  async queue(adminId:string){
    await this.requireRole(adminId,'administrativo');
    const [documents, skills] = await this.repository.listReviewQueue();
    return [...documents.map(d=>({id:`cv:${d.cv_id}`,userId:d.user_id,userName:d.name,type:'cv',title:d.cv_file_name??'CV PDF',status:d.review_status,extractionStatus:d.extraction_status,extractedCharacters:d.extracted_chars,date:d.submitted_at})),...skills.map(s=>({id:`skill:${s.id}`,userId:s.userId,userName:`${s.user.firstName} ${s.user.lastName}`,type:'skill',title:s.skill.name,status:s.verificationStatus,date:s.createdAt,areaId:s.skill.areaId,evidenceRefs:s.evidenceRefs}))].sort((a,b)=>new Date(b.date).getTime()-new Date(a.date).getTime());
  }
  async decision(adminId:string,kind:string,id:string,action:string){
    await this.requireRole(adminId,'administrativo');
    if(!['approved','rejected','revoked'].includes(action))throw new BadRequestException('Decisión inválida');
    if(kind==='cv'){
      const rows=await this.repository.changeCvDecision(adminId, id, action);
      if(!rows.length){
        const existing=await this.repository.cvOwner(id);
        if(!existing.length)throw new NotFoundException('CV inexistente');
        return this.recalculateAfterDecision(existing[0].user_id,adminId);
      }
      await this.audit(rows[0].user_id,adminId,`cv.${action}`,id);
      await this.nlp.refreshAfterChange(rows[0].user_id);
      return this.recalculateAfterDecision(rows[0].user_id,adminId);
    }
    if(kind==='skill'){
      const old=await this.repository.skillForDecision(id);
      if(!old)throw new NotFoundException('Habilidad no encontrada');
      const changed=await this.repository.changeSkillDecision(id, action);
      if(changed.count)await this.audit(old.userId,adminId,`skill.${action}`,id);
      return this.recalculateAfterDecision(old.userId,adminId);
    }
    throw new BadRequestException('Tipo de evidencia desconocido');
  }
  private async recalculateAfterDecision(userId:string,actorId:string){
    try{await this.publication.recalculate(userId,actorId);}catch{
      // La decisión ya se guardó; informar el estado recuperable sin indicar que se revirtió.
    }
    return this.publication.myRadar(userId);
  }
  async downloadForAdmin(adminId:string,cvId:string){
    await this.requireRole(adminId,'administrativo');
    const rows=await this.repository.cvForAdmin(cvId);
    if(!rows?.cvPdfData)throw new NotFoundException('Archivo no encontrado');
    await this.audit(rows.userId,adminId,'cv.viewed',cvId);
    return {filename:rows.cvFileName??'curriculum.pdf',buffer:Buffer.from(rows.cvPdfData,'base64')};
  }

}
