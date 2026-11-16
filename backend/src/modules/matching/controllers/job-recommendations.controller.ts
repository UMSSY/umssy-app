import { Controller, Get, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUserId } from '../../../common/decorators/current-user-id.decorator.js';
import { Roles } from '../../../common/decorators/roles.decorator.js';
import { RequestValidationException } from '../../../common/exceptions/request-validation.exception.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../../common/guards/roles.guard.js';
import { JobRecommendationsService } from '../services/job-recommendations.service.js';

export class InvalidJobOfferIdException extends RequestValidationException {
  constructor() {
    super([
      {
        field: 'id',
        message: 'El identificador de la vacante no es valido',
      },
    ]);
  }
}

@ApiTags('job-matching')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('titulado', 'estudiante')
@Controller('job-offers')
export class JobRecommendationsController {
  constructor(private readonly service: JobRecommendationsService) {}

  @Get('recommendations')
  async recommendations(@CurrentUserId() userId: string) {
    const s = this.service as any;
    if (typeof s.getRecommendations === 'function') {
      return s.getRecommendations(userId);
    }
    return s.recommendations(userId);
  }

  @Get(':id/match')
  async getJobFit(
    @Param(
      'id',
      new ParseUUIDPipe({
        version: '4',
        exceptionFactory: () => new InvalidJobOfferIdException(),
      }),
    )
    id: string,
    @CurrentUserId() userId: string,
  ) {
    const s = this.service as any;
    if (typeof s.getJobFit === 'function') {
      return s.getJobFit(userId, id);
    }
    return null;
  }
}