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
  ): Promise<JobApplicationResponse> {
    return this.jobApplicationsService.apply(userId, jobOfferId);
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
