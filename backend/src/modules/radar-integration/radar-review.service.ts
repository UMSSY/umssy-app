import { Injectable } from '@nestjs/common';
import { RadarReviewInvalidDecisionException } from './exceptions/radar-review-invalid-decision.exception.js';
import { RadarReviewInvalidEvidenceException } from './exceptions/radar-review-invalid-evidence.exception.js';
import { RadarReviewNotFoundException } from './exceptions/radar-review-not-found.exception.js';
import { RadarReviewRepository } from './repositories/radar-review.repository.js';
import { RadarAccessRepository } from './repositories/radar-access.repository.js';
import { ProfileSkillsAnalysisService } from '../nlp/services/profile-skills-analysis.service.js';
import { RadarPublicationService } from './radar-publication.service.js';
import { RadarReviewMapper } from './mappers/radar-review.mapper.js';


@Injectable()
export class RadarReviewService {
  constructor(private readonly repository: RadarReviewRepository, private readonly access: RadarAccessRepository, private readonly nlp: ProfileSkillsAnalysisService, private readonly publication: RadarPublicationService, private readonly mapper: RadarReviewMapper) {}
  private async audit(userId:string,actorId:string|null,event:string,targetId:string|null,details:object={}){
    await this.access.recordAudit(userId, actorId, event, targetId, details);
  }
  async queue(_adminId:string){
    return this.mapper.queue(await this.repository.listReviewQueue());
  }
  async decision(adminId:string,kind:string,id:string,action:string){
    if(!['approved','rejected','revoked'].includes(action))throw new RadarReviewInvalidDecisionException();
    if(kind==='cv'){
      const rows=await this.repository.changeCvDecision(adminId, id, action);
      if(!rows.length){
        const existing=await this.repository.cvOwner(id);
        if(!existing.length)throw new RadarReviewNotFoundException('CV inexistente');
        return this.recalculateAfterDecision(existing[0].user_id,adminId);
      }
      await this.audit(rows[0].user_id,adminId,`cv.${action}`,id);
      await this.nlp.refreshAfterChange(rows[0].user_id);
      return this.recalculateAfterDecision(rows[0].user_id,adminId);
    }
    if(kind==='skill'){
      const old=await this.repository.skillForDecision(id);
      if(!old)throw new RadarReviewNotFoundException('Habilidad no encontrada');
      const changed=await this.repository.changeSkillDecision(id, action);
      if(changed.count)await this.audit(old.userId,adminId,`skill.${action}`,id);
      return this.recalculateAfterDecision(old.userId,adminId);
    }
    throw new RadarReviewInvalidEvidenceException();
  }
  private async recalculateAfterDecision(userId:string,actorId:string){
    try{await this.publication.recalculate(userId,actorId);}catch{
      // La decisión ya se guardó; informar el estado recuperable sin indicar que se revirtió.
    }
    return this.publication.myRadar(userId);
  }
  async downloadForAdmin(adminId:string,cvId:string){
    const rows=await this.repository.cvForAdmin(cvId);
    if(!rows?.cvPdfData)throw new RadarReviewNotFoundException('Archivo no encontrado');
    await this.audit(rows.userId,adminId,'cv.viewed',cvId);
    return {filename:rows.cvFileName??'curriculum.pdf',buffer:Buffer.from(rows.cvPdfData,'base64')};
  }

}
