import { ConflictException, Injectable, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { ProfileSkillsEvents, type ProfileSkillsPublished } from '../../common/profile-skills/profile-skills-events.service.js';
import { ProfileSkillsAnalysisService } from '../nlp/services/profile-skills-analysis.service.js';
import { RadarPublicationService } from './radar-publication.service.js';
import { RadarCvService } from './radar-cv.service.js';
import { RadarReviewService } from './radar-review.service.js';
import { RadarRecruitmentService } from './radar-recruitment.service.js';

@Injectable()
export class RadarIntegrationService implements OnModuleInit, OnModuleDestroy {
  private unsubscribe?: () => void;
  constructor(
    private readonly nlp: ProfileSkillsAnalysisService,
    private readonly events: ProfileSkillsEvents,
    private readonly publication: RadarPublicationService,
    private readonly cv: RadarCvService,
    private readonly review: RadarReviewService,
    private readonly recruitment: RadarRecruitmentService,
  ) {}

  onModuleInit():void {
    this.unsubscribe=this.events.subscribe(publication=>this.recalculate(publication.userId,null,publication).then(()=>undefined));
  }
  onModuleDestroy():void { this.unsubscribe?.(); }

  async retry(userId:string){
    const analysis=await this.nlp.analyzeNow(userId);
    if(analysis.status!=='ready')throw new ConflictException('El análisis sigue pendiente o falló; puedes reintentarlo.');
    await this.recalculate(userId,userId);
    return this.myRadar(userId);
  }
  ingestCv(userId:string,cvId:string,buffer:Buffer,reprocess=false){return this.cv.ingestCv(userId,cvId,buffer,reprocess);}
  rescanCurrentCv(userId:string){return this.cv.rescanCurrentCv(userId);}
  reprocessCv(adminId:string,cvId:string){return this.cv.reprocessCv(adminId,cvId);}
  cvRemoved(userId:string,cvId:string){return this.cv.cvRemoved(userId,cvId);}
  recalculate(userId:string,actorId:string|null,publication?:ProfileSkillsPublished){return this.publication.recalculate(userId,actorId,publication);}
  myRadar(userId:string){return this.publication.myRadar(userId);}
  queue(adminId:string){return this.review.queue(adminId);}
  decision(adminId:string,kind:string,id:string,action:string){return this.review.decision(adminId,kind,id,action);}
  downloadForAdmin(adminId:string,cvId:string){return this.review.downloadForAdmin(adminId,cvId);}
  // Fachada de compatibilidad; toda la contratación se atiende en el dominio de reclutamiento.
  grantCompany(adminId:string,userId:string,companyId:string){return this.recruitment!.grantCompany(adminId,userId,companyId);}
  activeVacancies(){return this.recruitment!.activeVacancies();}
  apply(userId:string,jobId:string,consent:boolean,consentCv:boolean,consentContact=false){return this.recruitment!.apply(userId,jobId,consent,consentCv,consentContact);}
  myApplications(userId:string){return this.recruitment!.myApplications(userId);}
  updateMyApplicationConsents(userId:string,appId:string,consent:boolean,consentCv:boolean,consentContact:boolean){return this.recruitment!.updateMyApplicationConsents(userId,appId,consent,consentCv,consentContact);}
  withdrawMyApplication(userId:string,appId:string){return this.recruitment!.withdrawMyApplication(userId,appId);}
  recruiterVacancies(userId:string){return this.recruitment!.recruiterVacancies(userId);}
  recruiterApplicants(userId:string,jobId:string){return this.recruitment!.recruiterApplicants(userId,jobId);}
  recruiterAreaEvidence(userId:string,appId:string,areaId:string){return this.recruitment!.recruiterAreaEvidence(userId,appId,areaId);}
  recruiterCv(userId:string,appId:string){return this.recruitment!.recruiterCv(userId,appId);}
  decideApplication(userId:string,appId:string,decision:string){return this.recruitment!.decideApplication(userId,appId,decision);}
}
