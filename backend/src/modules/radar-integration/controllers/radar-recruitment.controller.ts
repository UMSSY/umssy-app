import { documentRadarEndpoint } from '../utils/document-radar-endpoint.js';
import {
  companyAccessResponseSchema,
  activeVacanciesResponseSchema,
  applicationResponseSchema,
  applicationsResponseSchema,
  consentsResponseSchema,
  applicationDecisionResponseSchema,
  vacanciesResponseSchema,
  applicantsResponseSchema,
  areaEvidenceResponseSchema,
} from '../responses/radar-api.response.js';
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
import { CurrentUserId } from '../../../common/decorators/current-user-id.decorator.js';
import { Roles } from '../../../common/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../../common/guards/roles.guard.js';
import { RequestValidationPipe } from '../../../common/pipes/request-validation.pipe.js';
import { toApiBody } from '../../../common/utils/to-api-body.js';
import { RadarRecruitmentService } from '../services/radar-recruitment.service.js';
import { companyAccessSchema } from '../requests/company-access.request.js';
import type { CompanyAccessRequest } from '../types/company-access-request.types.js';
import { applicationRequestSchema } from '../requests/application.request.js';
import type { ApplicationRequest } from '../types/application-request.types.js';
import { applicationConsentsSchema } from '../requests/application-consents.request.js';
import type { ApplicationConsentsRequest } from '../types/application-consents-request.types.js';
import { recruiterDecisionSchema } from '../requests/recruiter-decision.request.js';
import type { RecruiterDecisionRequest } from '../types/recruiter-decision-request.types.js';

@ApiTags('radar-integration')
@ApiBearerAuth()
@Controller('radar-integration')
@UseGuards(JwtAuthGuard)
export class RadarRecruitmentController {
  constructor(private readonly recruitment: RadarRecruitmentService) {}

  @UseGuards(RolesGuard)
  @Roles('administrativo')
  @documentRadarEndpoint({
    operationId: 'grantRadarCompanyAccess',
    summary: 'Vincular acceso a empresa',
    description:
      'Requiere rol administrativo. El usuario destino debe tener rol empresa y la empresa debe existir.',
    response: companyAccessResponseSchema,
    status: 201,
    errors: [400, 403, 404],
  })
  @Post('admin/company-access')
  @ApiBody(toApiBody(companyAccessSchema))
  grantCompany(
    @CurrentUserId() adminId: string,
    @Body(new RequestValidationPipe(companyAccessSchema))
    body: CompanyAccessRequest,
  ) {
    return this.recruitment.grantCompany(adminId, body.userId, body.companyId);
  }

  @documentRadarEndpoint({
    operationId: 'getRadarVacancies',
    summary: 'Consultar vacantes activas',
    description:
      'Requiere sesión. Devuelve la lista completa de vacantes activas, sin filtros ni paginación.',
    response: activeVacanciesResponseSchema,
  })
  @Get('vacancies')
  vacancies() {
    return this.recruitment.activeVacancies();
  }

  @UseGuards(RolesGuard)
  @Roles('titulado', 'estudiante')
  @documentRadarEndpoint({
    operationId: 'createRadarApplication',
    summary: 'Registrar postulación',
    description:
      'Requiere rol titulado o estudiante y consentimiento explícito para radar, CV y contacto.',
    response: applicationResponseSchema,
    status: 201,
    errors: [400, 403, 404, 409],
  })
  @Post('applications')
  @ApiBody(toApiBody(applicationRequestSchema))
  apply(
    @CurrentUserId() userId: string,
    @Body(new RequestValidationPipe(applicationRequestSchema))
    body: ApplicationRequest,
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
  @documentRadarEndpoint({
    operationId: 'getMyRadarApplications',
    summary: 'Consultar mis postulaciones',
    description:
      'Requiere rol titulado o estudiante. Lista completa de postulaciones del titular.',
    response: applicationsResponseSchema,
    errors: [403],
  })
  @Get('me/applications')
  myApplications(@CurrentUserId() userId: string) {
    return this.recruitment.myApplications(userId);
  }

  @UseGuards(RolesGuard)
  @Roles('titulado', 'estudiante')
  @documentRadarEndpoint({
    operationId: 'updateRadarApplicationConsents',
    summary: 'Actualizar consentimientos',
    description:
      'Requiere rol titulado o estudiante. Revocar el consentimiento general desactiva también CV y contacto.',
    response: consentsResponseSchema,
    errors: [400, 403, 404],
    parameters: ['id'],
  })
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
  @documentRadarEndpoint({
    operationId: 'withdrawRadarApplication',
    summary: 'Retirar postulación',
    description:
      'Requiere rol titulado o estudiante. Retira una postulación propia y revoca sus consentimientos.',
    response: applicationDecisionResponseSchema,
    errors: [400, 403, 404, 409],
    parameters: ['id'],
  })
  @Patch('me/applications/:id/withdraw')
  withdraw(
    @CurrentUserId() userId: string,
    @Param('id', new ParseUUIDPipe()) applicationId: string,
  ) {
    return this.recruitment.withdrawMyApplication(userId, applicationId);
  }

  @UseGuards(RolesGuard)
  @Roles('empresa')
  @documentRadarEndpoint({
    operationId: 'getRecruiterRadarVacancies',
    summary: 'Consultar vacantes de mi empresa',
    description:
      'Requiere rol empresa. Devuelve únicamente las vacantes de la empresa vinculada a la sesión.',
    response: vacanciesResponseSchema,
    errors: [403],
  })
  @Get('recruiter/vacancies')
  recruiterVacancies(@CurrentUserId() userId: string) {
    return this.recruitment.recruiterVacancies(userId);
  }

  @UseGuards(RolesGuard)
  @Roles('empresa')
  @documentRadarEndpoint({
    operationId: 'getRecruiterRadarApplicants',
    summary: 'Consultar afinidad de postulantes',
    description:
      'Requiere rol empresa y vinculación con la vacante. Ordena por afinidad descendente; omite perfiles sin consentimiento o radar publicado.',
    response: applicantsResponseSchema,
    errors: [400, 403, 404],
    parameters: ['id'],
  })
  @Get('recruiter/vacancies/:id/applicants')
  applicants(
    @CurrentUserId() userId: string,
    @Param('id', new ParseUUIDPipe()) jobId: string,
  ) {
    return this.recruitment.recruiterApplicants(userId, jobId);
  }

  @UseGuards(RolesGuard)
  @Roles('empresa')
  @documentRadarEndpoint({
    operationId: 'getRecruiterRadarEvidence',
    summary: 'Consultar evidencias por área',
    description:
      'Requiere rol empresa y acceso a la postulación. Solo expone respaldos de habilidades aprobadas y publicadas.',
    response: areaEvidenceResponseSchema,
    errors: [400, 403, 404],
    parameters: ['id', 'areaId'],
  })
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
  @documentRadarEndpoint({
    operationId: 'previewRecruiterRadarCv',
    summary: 'Consultar CV autorizado',
    description:
      'Requiere rol empresa, vinculación y consentimiento vigente para compartir el CV. Devuelve PDF.',
    binary: true,
    mime: 'application/pdf',
    errors: [400, 403, 404],
    parameters: ['id'],
  })
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
  @documentRadarEndpoint({
    operationId: 'decideRecruiterRadarApplication',
    summary: 'Resolver postulación',
    description:
      'Requiere rol empresa y vinculación con la postulación. Registra contratación o rechazo; los estados finales devuelven conflicto.',
    response: applicationDecisionResponseSchema,
    errors: [400, 403, 404, 409],
    parameters: ['id'],
  })
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
