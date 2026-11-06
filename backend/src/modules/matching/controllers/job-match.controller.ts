import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
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
import { JOB_OFFER_NOT_AVAILABLE_MESSAGE } from '../constants/job-match.constants.js';
import { JobMatchParamsDto } from '../requests/job-match.schema.js';
import { JobMatchService } from '../services/job-match.service.js';
import type { JobMatchResponse } from '../types/job-match.types.js';

@ApiTags('job-matching')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'A valid access token is required' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('titulado', 'estudiante')
@Controller('job-offers')
export class JobMatchController {
  constructor(private readonly jobMatchService: JobMatchService) {}

  @Get(':id/match')
  @ApiOperation({
    summary:
      'Afinidad y requisitos de una vacante frente al perfil de la persona autenticada',
  })
  @ApiOkResponse({
    description:
      'Puntaje de afinidad (0 a 100) y requisitos con estado Cumple o Pendiente',
  })
  @ApiNotFoundResponse({ description: JOB_OFFER_NOT_AVAILABLE_MESSAGE })
  getMatch(
    @CurrentUserId() userId: string,
    @Param() params: JobMatchParamsDto,
  ): Promise<JobMatchResponse> {
    return this.jobMatchService.getMatch(userId, params.id);
  }
}
