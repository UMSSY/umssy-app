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
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RequestValidationPipe } from '../../common/pipes/request-validation.pipe.js';
import { toApiBody } from '../../common/utils/to-api-body.js';
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

@ApiTags('radar-integration')
@ApiBearerAuth()
@Controller('radar-integration')
@UseGuards(JwtAuthGuard)
export class RadarIntegrationController {
  constructor(private readonly service: RadarRecruitmentService) {}

  @Post('admin/company-access')
  @ApiBody(toApiBody(companyAccessSchema))
  grantCompany(
    @CurrentUserId() adminId: string,
    @Body(new RequestValidationPipe(companyAccessSchema)) body: CompanyAccessRequest,
  ) {
    return this.service.grantCompany(adminId, body.userId, body.companyId);
  }

  @Get('vacancies')
  vacancies() {
    return this.service.activeVacancies();
  }

  @Post('applications')
  @ApiBody(toApiBody(applicationRequestSchema))
  apply(
    @CurrentUserId() userId: string,
    @Body(new RequestValidationPipe(applicationRequestSchema)) body: ApplicationRequest,
  ) {
    return this.service.apply(
      userId,
      body.jobOfferId,
      body.consent === true,
      body.consentCv === true,
      body.consentContact === true,
    );
  }

  @Get('me/applications')
  myApplications(@CurrentUserId() userId: string) {
    return this.service.myApplications(userId);
  }

  @Patch('me/applications/:id/consents')
  @ApiBody(toApiBody(applicationConsentsSchema))
  updateConsents(
    @CurrentUserId() userId: string,
    @Param('id', new ParseUUIDPipe()) applicationId: string,
    @Body(new RequestValidationPipe(applicationConsentsSchema))
    body: ApplicationConsentsRequest,
  ) {
    return this.service.updateMyApplicationConsents(
      userId,
      applicationId,
      body.consent,
      body.consentCv,
      body.consentContact,
    );
  }

  @Patch('me/applications/:id/withdraw')
  withdraw(
    @CurrentUserId() userId: string,
    @Param('id', new ParseUUIDPipe()) applicationId: string,
  ) {
    return this.service.withdrawMyApplication(userId, applicationId);
  }

  @Get('recruiter/vacancies')
  recruiterVacancies(@CurrentUserId() userId: string) {
    return this.service.recruiterVacancies(userId);
  }

  @Get('recruiter/vacancies/:id/applicants')
  applicants(
    @CurrentUserId() userId: string,
    @Param('id', new ParseUUIDPipe()) jobId: string,
  ) {
    return this.service.recruiterApplicants(userId, jobId);
  }

  @Get('recruiter/applications/:id/areas/:areaId/evidence')
  recruiterEvidence(
    @CurrentUserId() recruiterId: string,
    @Param('id', new ParseUUIDPipe()) applicationId: string,
    @Param('areaId') areaId: string,
  ) {
    return this.service.recruiterAreaEvidence(recruiterId, applicationId, areaId);
  }

  @Get('recruiter/applications/:id/cv')
  async recruiterCv(
    @CurrentUserId() userId: string,
    @Param('id', new ParseUUIDPipe()) applicationId: string,
  ) {
    const buffer = await this.service.recruiterCv(userId, applicationId);
    return new StreamableFile(buffer, {
      type: 'application/pdf',
      disposition: 'inline; filename="cv-autorizado.pdf"',
    });
  }

  @Patch('recruiter/applications/:id')
  @ApiBody(toApiBody(recruiterDecisionSchema))
  decide(
    @CurrentUserId() userId: string,
    @Param('id', new ParseUUIDPipe()) applicationId: string,
    @Body(new RequestValidationPipe(recruiterDecisionSchema))
    body: RecruiterDecisionRequest,
  ) {
    return this.service.decideApplication(userId, applicationId, body.decision);
  }
}
