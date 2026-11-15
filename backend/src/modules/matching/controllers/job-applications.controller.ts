import { Body } from '@nestjs/common';
import { RequestValidationPipe } from '../../../common/pipes/request-validation.pipe.js';
import {
  jobApplicationConsentsSchema,
  type JobApplicationConsentsRequest,
} from '../requests/job-application-consents.request.js';
import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBody,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUserId } from '../../../common/decorators/current-user-id.decorator.js';
import { Roles } from '../../../common/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../../common/guards/roles.guard.js';
import { JobOfferUnavailableException } from '../exceptions/job-offer-unavailable.exception.js';
import { JobApplicationsService } from '../services/job-applications.service.js';
import type {
  JobApplicationResponse,
  MyJobApplicationResponse,
} from '../types/job-application.types.js';
import { toApiBody } from '../../../common/utils/to-api-body.js';

const jobOfferIdPipe = new ParseUUIDPipe({
  exceptionFactory: () => new JobOfferUnavailableException(),
});

@ApiTags('job-applications')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'A valid access token is required' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('titulado', 'estudiante')
@Controller('job-offers/:id/applications')
export class JobApplicationsController {
  constructor(
    private readonly jobApplicationsService: JobApplicationsService,
  ) {}

  @Post()
  @ApiBody(toApiBody(jobApplicationConsentsSchema))
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Postula al usuario autenticado a una vacante publicada',
  })
  @ApiCreatedResponse({
    description: 'Postulación registrada en estado "En revisión"',
  })
  @ApiNotFoundResponse({
    description: 'La vacante no existe o no está disponible',
  })
  @ApiConflictResponse({
    description: 'El usuario ya se postuló a esta vacante',
  })
  apply(
    @Param('id', jobOfferIdPipe) jobOfferId: string,
    @CurrentUserId() userId: string,
    @Body(new RequestValidationPipe(jobApplicationConsentsSchema))
    consents: JobApplicationConsentsRequest,
  ): Promise<JobApplicationResponse> {
    return this.jobApplicationsService.apply(userId, jobOfferId, consents);
  }

  @Get('me')
  @ApiOperation({
    summary: 'Indica si el usuario autenticado ya se postuló a la vacante',
  })
  @ApiOkResponse({
    description: 'Postulación del usuario o null si aún no se postuló',
  })
  findMine(
    @Param('id', jobOfferIdPipe) jobOfferId: string,
    @CurrentUserId() userId: string,
  ): Promise<MyJobApplicationResponse> {
    return this.jobApplicationsService.findMine(userId, jobOfferId);
  }
}
