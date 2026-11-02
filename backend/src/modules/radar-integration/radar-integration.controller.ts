import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, StreamableFile, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import { CurrentUserId } from '../../common/decorators/current-user-id.decorator.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RadarIntegrationService } from './radar-integration.service.js';
import { RequestValidationPipe } from '../../common/pipes/request-validation.pipe.js';
import { toApiBody } from '../../common/utils/to-api-body.js';
import {
  reviewKindSchema, reviewDecisionSchema, companyAccessSchema,
  applicationRequestSchema, applicationConsentsSchema, recruiterDecisionSchema,
  type ReviewDecisionRequest, type CompanyAccessRequest,
  type ApplicationRequest, type ApplicationConsentsRequest,
  type RecruiterDecisionRequest,
} from './requests/radar-integration.requests.js';

@ApiTags('radar-integration')
@ApiBearerAuth()
@Controller('radar-integration')
@UseGuards(JwtAuthGuard)
export class RadarIntegrationController {
  constructor(private readonly svc:RadarIntegrationService){}
  @Get('me') me(@CurrentUserId() user:string){return this.svc.myRadar(user);}
  @Post('me/cv-rescan') rescan(@CurrentUserId() user:string){return this.svc.rescanCurrentCv(user);}
  @Post('me/recalculate') recalculate(@CurrentUserId() user:string){return this.svc.retry(user);}
  @Get('admin/queue') queue(@CurrentUserId() admin:string){return this.svc.queue(admin);}
  @ApiBody(toApiBody(reviewDecisionSchema))
  @Patch('admin/reviews/:kind/:id') decision(@CurrentUserId() admin:string,@Param('kind',new RequestValidationPipe(reviewKindSchema)) kind:string,@Param('id',new ParseUUIDPipe()) id:string,@Body(new RequestValidationPipe(reviewDecisionSchema)) body:ReviewDecisionRequest){
    return this.svc.decision(admin,kind,id,body.decision);
  }
  @Post('admin/cv/:id/reprocess') reprocessCv(@CurrentUserId() admin:string,@Param('id',new ParseUUIDPipe()) id:string){
    return this.svc.reprocessCv(admin,id);
  }
  @Get('admin/cv/:id/file') async download(@CurrentUserId() admin:string,@Param('id',new ParseUUIDPipe()) id:string){
    const f=await this.svc.downloadForAdmin(admin,id);
    return new StreamableFile(f.buffer,{type:'application/pdf',disposition:'inline; filename="documento.pdf"'});
  }
  @Post('admin/company-access')
  @ApiBody(toApiBody(companyAccessSchema))
  grant(@CurrentUserId() admin:string,@Body(new RequestValidationPipe(companyAccessSchema)) b:CompanyAccessRequest){
    return this.svc.grantCompany(admin,b.userId,b.companyId);
  }
  @Get('vacancies') vacancies(){return this.svc.activeVacancies();}
  @ApiBody(toApiBody(applicationRequestSchema))
  @Post('applications') apply(@CurrentUserId() user:string,@Body(new RequestValidationPipe(applicationRequestSchema)) b:ApplicationRequest){
    return this.svc.apply(user,b.jobOfferId,b.consent===true,b.consentCv===true,b.consentContact===true);
  }
  @Get('me/applications') applications(@CurrentUserId() user:string){return this.svc.myApplications(user);}
  @ApiBody(toApiBody(applicationConsentsSchema))
  @Patch('me/applications/:id/consents') updateConsents(@CurrentUserId() user:string,@Param('id',new ParseUUIDPipe()) id:string,@Body(new RequestValidationPipe(applicationConsentsSchema)) body:ApplicationConsentsRequest){
    return this.svc.updateMyApplicationConsents(user,id,body.consent,body.consentCv,body.consentContact);
  }
  @Patch('me/applications/:id/withdraw') withdraw(@CurrentUserId() user:string,@Param('id',new ParseUUIDPipe()) id:string){return this.svc.withdrawMyApplication(user,id);}
  @Get('recruiter/vacancies') recruiterVacancies(@CurrentUserId() id:string){return this.svc.recruiterVacancies(id);}
  @Get('recruiter/vacancies/:id/applicants') applicants(@CurrentUserId() id:string,@Param('id',new ParseUUIDPipe()) jobId:string){return this.svc.recruiterApplicants(id,jobId);}
  @Get('recruiter/applications/:id/areas/:areaId/evidence')
  recruiterEvidence(@CurrentUserId() recruiterId:string,@Param('id',new ParseUUIDPipe()) appId:string,@Param('areaId') areaId:string){
    return this.svc.recruiterAreaEvidence(recruiterId,appId,areaId);
  }
  @Get('recruiter/applications/:id/cv') async recruiterCv(@CurrentUserId() user:string,@Param('id',new ParseUUIDPipe()) appId:string){
    const buffer=await this.svc.recruiterCv(user,appId);
    return new StreamableFile(buffer,{type:'application/pdf',disposition:'inline; filename="cv-autorizado.pdf"'});
  }
  @ApiBody(toApiBody(recruiterDecisionSchema))
  @Patch('recruiter/applications/:id') decide(@CurrentUserId() id:string,@Param('id',new ParseUUIDPipe()) appId:string,@Body(new RequestValidationPipe(recruiterDecisionSchema)) body:RecruiterDecisionRequest){
    return this.svc.decideApplication(id,appId,body.decision);
  }
}
