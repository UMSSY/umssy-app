import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  StandardSchemaValidationPipe,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { RequestValidationException } from '../../../common/exceptions/request-validation.exception.js';
import { Roles } from '../../../common/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../../common/guards/roles.guard.js';
import { buildRequestValidationException } from '../../../common/utils/build-request-validation-exception.js';
import { toApiBody } from '../../../common/utils/to-api-body.js';
import {
  JOB_OFFER_SORT_FIELDS,
  JOB_OFFER_SORT_ORDERS,
  JOB_OFFER_TITLE_MAX_LENGTH,
  JOB_OFFER_VALIDATION_MESSAGES,
} from '../constants/job-offer.constants.js';
import {
  createJobOfferSchema,
  type CreateJobOfferRequest,
} from '../requests/create-job-offer.request.js';
import {
  listCompanyJobOffersSchema,
  type ListCompanyJobOffersRequest,
} from '../requests/list-company-job-offers.request.js';
import type { JobOfferCreatedResponse } from '../responses/job-offer-created.response.js';
import type {
  JobOfferResponse,
  JobOfferSkillResponse,
} from '../responses/job-offer.response.js';
import { JobOffersService } from '../services/job-offers.service.js';
import { JobOfferContractType, JobOfferModality } from '../types/job-offer.enum.js';

const companyIdPipe = new ParseUUIDPipe({
  exceptionFactory: () =>
    new RequestValidationException([
      { field: 'companyId', message: JOB_OFFER_VALIDATION_MESSAGES.INVALID_COMPANY_ID },
    ]),
});
const jobOfferIdPipe = new ParseUUIDPipe({
  exceptionFactory: () =>
    new RequestValidationException([
      { field: 'jobOfferId', message: JOB_OFFER_VALIDATION_MESSAGES.INVALID_JOB_OFFER_ID },
    ]),
});

@ApiTags('job-offers')
@UsePipes(
  new StandardSchemaValidationPipe({
    exceptionFactory: buildRequestValidationException,
  }),
)
@Controller()
export class JobOffersController {
  constructor(private readonly jobOffersService: JobOffersService) {}

  @Get('job-offers')
  @ApiOperation({ summary: 'Lista las vacantes publicadas y vigentes para los egresados' })
  @ApiOkResponse({ description: 'Vacantes publicadas, de la más reciente a la más antigua' })
  listPublished(): Promise<JobOfferResponse[]> {
    return this.jobOffersService.listPublished();
  }

  @Get('job-offers/skills')
  @ApiOperation({ summary: 'Lista el catálogo cerrado de tecnologías para una vacante' })
  @ApiOkResponse({ description: 'Tecnologías verificadas del catálogo' })
  listSkillCatalog(): Promise<JobOfferSkillResponse[]> {
    return this.jobOffersService.listSkillCatalog();
  }

  @Post('companies/:companyId/job-offers')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Publica una nueva vacante de la empresa' })
  @ApiBody(toApiBody(createJobOfferSchema))
  @ApiCreatedResponse({ description: 'Vacante publicada' })
  create(
    @Param('companyId', companyIdPipe) companyId: string,
    @Body({ schema: createJobOfferSchema }) request: CreateJobOfferRequest,
  ): Promise<JobOfferCreatedResponse> {
    return this.jobOffersService.create(companyId, request);
  }

  @Get('companies/:companyId/job-offers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('empresa')
  @ApiOperation({ summary: 'Lista las vacantes de una empresa, con filtros opcionales' })
  @ApiQuery({ name: 'modality', required: false, enum: JobOfferModality })
  @ApiQuery({ name: 'contractType', required: false, enum: JobOfferContractType })
  @ApiQuery({
    name: 'dateFrom',
    required: false,
    type: String,
    description: 'Publicadas desde este día, en hora de Bolivia (AAAA-MM-DD)',
    example: '2026-10-01',
  })
  @ApiQuery({
    name: 'dateTo',
    required: false,
    type: String,
    description: 'Publicadas hasta este día inclusive, en hora de Bolivia (AAAA-MM-DD)',
    example: '2026-10-31',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Parte del título del puesto, sin distinguir mayúsculas',
    maxLength: JOB_OFFER_TITLE_MAX_LENGTH,
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: JOB_OFFER_SORT_FIELDS,
    description: 'Por defecto createdAt. applicants ordena por fecha hasta que existan postulaciones',
  })
  @ApiQuery({
    name: 'order',
    required: false,
    enum: JOB_OFFER_SORT_ORDERS,
    description: 'Por defecto desc (más recientes primero)',
  })
  @ApiOkResponse({ description: 'Vacantes de la empresa que cumplen los filtros' })
  listByCompany(
    @Param('companyId', companyIdPipe) companyId: string,
    @Query({ schema: listCompanyJobOffersSchema }) filters: ListCompanyJobOffersRequest,
  ): Promise<JobOfferResponse[]> {
    return this.jobOffersService.listByCompany(companyId, filters);
  }

  @Get('companies/:companyId/job-offers/:jobOfferId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('empresa')
  @ApiOperation({ summary: 'Obtiene los detalles de una vacante de la empresa' })
  @ApiOkResponse({ description: 'Detalles de la vacante solicitada' })
  @ApiNotFoundResponse({ description: 'La vacante no existe o no pertenece a la empresa' })
  getByCompanyAndId(
    @Param('companyId', companyIdPipe) companyId: string,
    @Param('jobOfferId', jobOfferIdPipe) jobOfferId: string,
  ): Promise<JobOfferResponse> {
    return this.jobOffersService.getByCompanyAndId(companyId, jobOfferId);
  }

  @Put('companies/:companyId/job-offers/:jobOfferId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('empresa')
  @ApiOperation({ summary: 'Edita una vacante de la empresa' })
  @ApiBody(toApiBody(createJobOfferSchema))
  @ApiOkResponse({ description: 'Vacante actualizada' })
  @ApiNotFoundResponse({ description: 'La vacante no existe o no pertenece a la empresa' })
  update(
    @Param('companyId', companyIdPipe) companyId: string,
    @Param('jobOfferId', jobOfferIdPipe) jobOfferId: string,
    @Body({ schema: createJobOfferSchema }) request: CreateJobOfferRequest,
  ): Promise<JobOfferResponse> {
    return this.jobOffersService.update(companyId, jobOfferId, request);
  }

 @Delete('companies/:companyId/job-offers/:jobOfferId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('empresa')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Elimina una vacante de la empresa' })
  @ApiNoContentResponse({ description: 'Vacante eliminada exitosamente' })
  @ApiNotFoundResponse({ description: 'La vacante no existe o no pertenece a la empresa' })
  remove(
    @Param('companyId', companyIdPipe) companyId: string,
    @Param('jobOfferId', jobOfferIdPipe) jobOfferId: string,
  ): Promise<void> {
    console.log('>>> [BACKEND] Petición DELETE recibida:', { companyId, jobOfferId });
    return this.jobOffersService.softDelete(companyId, jobOfferId);
  }
}