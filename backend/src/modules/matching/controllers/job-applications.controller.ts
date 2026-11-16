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
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
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
import {
  apiApplyToJobOffer,
  apiGetMyJobApplication,
} from '../swagger/matching.swagger.js';

const jobOfferIdPipe = new ParseUUIDPipe({
  exceptionFactory: () => new JobOfferUnavailableException(),
});

@ApiTags('matching')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('titulado', 'estudiante')
@Controller('job-offers/:id/applications')
export class JobApplicationsController {
  constructor(
    private readonly jobApplicationsService: JobApplicationsService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @apiApplyToJobOffer()
  apply(
    @Param('id', jobOfferIdPipe) jobOfferId: string,
    @CurrentUserId() userId: string,
    @Body(new RequestValidationPipe(jobApplicationConsentsSchema))
    consents: JobApplicationConsentsRequest,
  ): Promise<JobApplicationResponse> {
    return this.jobApplicationsService.apply(userId, jobOfferId, consents);
  }

  @Get('me')
  @apiGetMyJobApplication()
  findMine(
    @Param('id', jobOfferIdPipe) jobOfferId: string,
    @CurrentUserId() userId: string,
  ): Promise<MyJobApplicationResponse> {
    return this.jobApplicationsService.findMine(userId, jobOfferId);
  }
}
