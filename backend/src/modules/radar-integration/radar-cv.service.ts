import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { RadarCvRepository } from './repositories/radar-cv.repository.js';
import { RadarAccessRepository } from './repositories/radar-access.repository.js';
import { ProfileSkillsAnalysisService } from '../nlp/services/profile-skills-analysis.service.js';
import { RadarPublicationService } from './radar-publication.service.js';
import { RadarPdfExtractionService } from './radar-pdf-extraction.service.js';

@Injectable()
export class RadarCvService {
  constructor(
    private readonly repository: RadarCvRepository,
    private readonly access: RadarAccessRepository,
    private readonly nlp:ProfileSkillsAnalysisService,
    private readonly publication:RadarPublicationService,
    private readonly extractor:RadarPdfExtractionService,
  ){}
  private async requireRole(id:string,role:string):Promise<void>{
    const allowed = await this.access.hasRole(id, role);
    if (!allowed)throw new ForbiddenException(`Se requiere rol ${role}`);
  }
  private async audit(userId:string,actorId:string|null,event:string,targetId:string|null,details:object={}){
    await this.access.recordAudit(userId, actorId, event, targetId, details);
  }
  // Se llama solo después de que la carga original de CV haya sido guardada por Épica 2.
  // La extracción NO aprueba automáticamente ningún documento ni habilidad.
  // Se invoca al guardar un CV nuevo o al reprocesar uno historico.
  // Reprocesar jamas revoca silenciosamente una decision administrativa anterior.
  async ingestCv(userId:string,cvId:string,buffer:Buffer,reprocess=false){
    const {extractedText,extractionStatus}=await this.extractor.extract(buffer);
    const rows = await this.repository.upsertEvidence(userId, cvId, extractedText, extractionStatus);
    if(!rows.length)throw new ForbiddenException('El CV no pertenece al titular');
    await this.audit(userId,null,reprocess?'cv.reprocessed':'cv.submitted',cvId,{extractionStatus,textCharacters:extractedText.length});
    // El analisis genera detecciones pendientes, nunca aprobaciones automaticas.
    await this.nlp.refreshAfterChange(userId);
    await this.publication.recalculate(userId,null);
    const nlp=await this.nlp.getRadarSnapshot(userId);
    return {cvId,extractionStatus,extractedCharacters:extractedText.length,reviewStatus:rows[0].review_status,nlpStatus:nlp.status};
  }
  async rescanCurrentCv(userId:string){
    const cv=await this.repository.currentCv(userId);
    if(!cv?.cvPdfData)throw new NotFoundException('No hay CV vigente para analizar');
    return this.ingestCv(userId,cv.id,Buffer.from(cv.cvPdfData,'base64'),true);
  }
  async reprocessCv(adminId:string,cvId:string){
    await this.requireRole(adminId,'administrativo');
    const cv=await this.repository.cvById(cvId);
    if(!cv?.cvPdfData)throw new NotFoundException('CV inexistente o sin archivo');
    const result=await this.ingestCv(cv.userId,cvId,Buffer.from(cv.cvPdfData,'base64'),true);
    await this.audit(cv.userId,adminId,'cv.admin_reprocessed',cvId,{extractionStatus:result.extractionStatus});
    return result;
  }
  async cvRemoved(userId:string,cvId:string){
    await this.audit(userId,userId,'cv.removed',cvId);
    await this.nlp.refreshAfterChange(userId);
    await this.publication.recalculate(userId,userId);
  }

}
