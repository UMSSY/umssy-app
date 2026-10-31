import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Roles } from '../../../common/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../../common/guards/roles.guard.js';
import { JobOfferUnavailableException } from '../exceptions/job-offer-unavailable.exception.js';
import { CompanyJobApplicantsService } from '../services/company-job-applicants.service.js';
import type { CompanyJobApplicantsResponse } from '../types/company-job-applicants.types.js';

const uuidPipe = new ParseUUIDPipe({
  exceptionFactory: () => new JobOfferUnavailableException(),
});

@ApiTags('job-applications')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'A valid access token is required' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('empresa')
@Controller('companies/:companyId/job-offers/:jobOfferId/applications')
export class CompanyJobApplicantsController {
  constructor(
    private readonly companyJobApplicantsService: CompanyJobApplicantsService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Lista cuántos y quiénes se postularon a una vacante de la empresa',
  })
  @ApiOkResponse({
    description: 'Total de postulantes y su detalle, del más reciente al más antiguo',
  })
  @ApiNotFoundResponse({
    description: 'La vacante no existe o no pertenece a la empresa',
  })
  listByOffer(
    @Param('companyId', uuidPipe) companyId: string,
    @Param('jobOfferId', uuidPipe) jobOfferId: string,
  ): Promise<CompanyJobApplicantsResponse> {
    return this.companyJobApplicantsService.listByOffer(companyId, jobOfferId);
  }
}
