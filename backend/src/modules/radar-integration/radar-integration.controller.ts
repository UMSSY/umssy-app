import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import { CurrentUserId } from '../../common/decorators/current-user-id.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { RequestValidationPipe } from '../../common/pipes/request-validation.pipe.js';
import { toApiBody } from '../../common/utils/to-api-body.js';
import { RadarIntegrationService } from './radar-integration.service.js';
import { RadarRecruitmentService } from './radar-recruitment.service.js';
import {
  applicationConsentsSchema,
  applicationRequestSchema,
  companyAccessSchema,
  recruiterDecisionSchema,
  type ApplicationConsentsRequest,
  type ApplicationRequest,
  type CompanyAccessRequest,
  type RecruiterDecisionRequest,
} from './requests/radar-integration.requests.js';
import {
  reviewDecisionSchema,
  reviewKindSchema,
  type ReviewDecisionRequest,
  type ReviewKind,
} from './requests/radar-review.request.js';

@ApiTags('radar-integration')
@ApiBearerAuth()
@Controller('radar-integration')
@UseGuards(JwtAuthGuard)
export class RadarIntegrationController {
  constructor(
    private readonly svc: RadarIntegrationService,
    private readonly recruitment: RadarRecruitmentService,
  ) {}

  @Get('me')
  me(@CurrentUserId() user: string) {
    return this.svc.myRadar(user);
  }

  @Post('me/cv-rescan')
  rescan(@CurrentUserId() user: string) {
    return this.svc.rescanCurrentCv(user);
  }

  @Post('me/recalculate')
  recalculate(@CurrentUserId() user: string) {
    return this.svc.retry(user);
  }

  @UseGuards(RolesGuard)
  @Roles('administrativo')
  @Get('admin/queue')
  queue(@CurrentUserId() admin: string) {
    return this.svc.queue(admin);
  }

  @UseGuards(RolesGuard)
  @Roles('administrativo')
  @ApiBody(toApiBody(reviewDecisionSchema))
  @Patch('admin/reviews/:kind/:id')
  decision(
    @CurrentUserId() admin: string,
    @Param('kind', new RequestValidationPipe(reviewKindSchema)) kind: ReviewKind,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body(new RequestValidationPipe(reviewDecisionSchema)) body: ReviewDecisionRequest,
  ) {
    return this.svc.decision(admin, kind, id, body.decision);
  }

  @UseGuards(RolesGuard)
  @Roles('administrativo')
  @Post('admin/cv/:id/reprocess')
  reprocessCv(
    @CurrentUserId() admin: string,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.svc.reprocessCv(admin, id);
  }

  @UseGuards(RolesGuard)
  @Roles('administrativo')
  @Get('admin/cv/:id/file')
  async download(
    @CurrentUserId() admin: string,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    const f = await this.svc.downloadForAdmin(admin, id);
    return new StreamableFile(f.buffer, {
      type: 'application/pdf',
      disposition: 'inline; filename="documento.pdf"',
    });
  }

  // HU4: vínculo administrador -> empresa reclutadora.
  @UseGuards(RolesGuard)
  @Roles('administrativo')
  @Post('admin/company-access')
  @ApiBody(toApiBody(companyAccessSchema))
  grantCompany(
    @CurrentUserId() adminId: string,
    @Body(new RequestValidationPipe(companyAccessSchema)) body: CompanyAccessRequest,
  ) {
    return this.recruitment.grantCompany(adminId, body.userId, body.companyId);
  }

  @Get('vacancies')
  vacancies() {
    return this.recruitment.activeVacancies();
  }

  @UseGuards(RolesGuard)
  @Roles('titulado', 'estudiante')
  @Post('applications')
  @ApiBody(toApiBody(applicationRequestSchema))
  apply(
    @CurrentUserId() userId: string,
    @Body(new RequestValidationPipe(applicationRequestSchema)) body: ApplicationRequest,
  ) {
    return this.recruitment.apply(
      userId,
      body.jobOfferId,
      body.consent === true,
      body.consentCv === true,
      body.consentContact === true,
    );
  }

  @UseGuards(RolesGuard)
  @Roles('titulado', 'estudiante')
  @Get('me/applications')
  myApplications(@CurrentUserId() userId: string) {
    return this.recruitment.myApplications(userId);
  }

  @UseGuards(RolesGuard)
  @Roles('titulado', 'estudiante')
  @Patch('me/applications/:id/consents')
  @ApiBody(toApiBody(applicationConsentsSchema))
  updateConsents(
    @CurrentUserId() userId: string,
    @Param('id', new ParseUUIDPipe()) applicationId: string,
    @Body(new RequestValidationPipe(applicationConsentsSchema))
    body: ApplicationConsentsRequest,
  ) {
    return this.recruitment.updateMyApplicationConsents(
      userId,
      applicationId,
      body.consent,
      body.consentCv,
      body.consentContact,
    );
  }

  @UseGuards(RolesGuard)
  @Roles('titulado', 'estudiante')
  @Patch('me/applications/:id/withdraw')
  withdraw(
    @CurrentUserId() userId: string,
    @Param('id', new ParseUUIDPipe()) applicationId: string,
  ) {
    return this.recruitment.withdrawMyApplication(userId, applicationId);
  }

  @UseGuards(RolesGuard)
  @Roles('empresa')
  @Get('recruiter/vacancies')
  recruiterVacancies(@CurrentUserId() userId: string) {
    return this.recruitment.recruiterVacancies(userId);
  }

  @UseGuards(RolesGuard)
  @Roles('empresa')
  @Get('recruiter/vacancies/:id/applicants')
  applicants(
    @CurrentUserId() userId: string,
    @Param('id', new ParseUUIDPipe()) jobId: string,
  ) {
    return this.recruitment.recruiterApplicants(userId, jobId);
  }

  @UseGuards(RolesGuard)
  @Roles('empresa')
  @Get('recruiter/applications/:id/areas/:areaId/evidence')
  recruiterEvidence(
    @CurrentUserId() recruiterId: string,
    @Param('id', new ParseUUIDPipe()) applicationId: string,
    @Param('areaId') areaId: string,
  ) {
    return this.recruitment.recruiterAreaEvidence(
      recruiterId,
      applicationId,
      areaId,
    );
  }

  @UseGuards(RolesGuard)
  @Roles('empresa')
  @Get('recruiter/applications/:id/cv')
  async recruiterCv(
    @CurrentUserId() userId: string,
    @Param('id', new ParseUUIDPipe()) applicationId: string,
  ) {
    const buffer = await this.recruitment.recruiterCv(userId, applicationId);
    return new StreamableFile(buffer, {
      type: 'application/pdf',
      disposition: 'inline; filename="cv-autorizado.pdf"',
    });
  }

  @UseGuards(RolesGuard)
  @Roles('empresa')
  @Patch('recruiter/applications/:id')
  @ApiBody(toApiBody(recruiterDecisionSchema))
  decide(
    @CurrentUserId() userId: string,
    @Param('id', new ParseUUIDPipe()) applicationId: string,
    @Body(new RequestValidationPipe(recruiterDecisionSchema))
    body: RecruiterDecisionRequest,
  ) {
    return this.recruitment.decideApplication(
      userId,
      applicationId,
      body.decision,
    );
  }
}
