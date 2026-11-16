import { CompanyOwnershipGuard } from '../../../common/guards/company-ownership.guard.js';
import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../../common/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../../common/guards/roles.guard.js';
import { JobOfferUnavailableException } from '../exceptions/job-offer-unavailable.exception.js';
import { apiListJobOfferApplicants } from '../swagger/matching.swagger.js';
import { CompanyJobApplicantsService } from '../services/company-job-applicants.service.js';
import type { CompanyJobApplicantsResponse } from '../types/company-job-applicants.types.js';

const uuidPipe = new ParseUUIDPipe({
  exceptionFactory: () => new JobOfferUnavailableException(),
});

@ApiTags('matching')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, CompanyOwnershipGuard)
@Roles('empresa')
@Controller('companies/:companyId/job-offers/:jobOfferId/applications')
export class CompanyJobApplicantsController {
  constructor(
    private readonly companyJobApplicantsService: CompanyJobApplicantsService,
  ) {}

  @Get()
  @apiListJobOfferApplicants()
  listByOffer(
    @Param('companyId', uuidPipe) companyId: string,
    @Param('jobOfferId', uuidPipe) jobOfferId: string,
  ): Promise<CompanyJobApplicantsResponse> {
    return this.companyJobApplicantsService.listByOffer(companyId, jobOfferId);
  }
}
