import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../../common/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../../common/guards/roles.guard.js';
import { SURVEYS_ROLE } from '../constants/surveys-access.constants.js';
import type { CareerResponse } from '../responses/career.response.js';
import { CareersService } from '../services/careers.service.js';

@ApiTags('Encuestas')
@Controller('careers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(SURVEYS_ROLE)
export class CareersController {
  constructor(private readonly careersService: CareersService) {}

  @Get()
  @ApiOperation({ summary: 'Lista las carreras disponibles para dirigir una encuesta' })
  @ApiOkResponse({ description: 'Carreras ordenadas alfabéticamente' })
  list(): Promise<CareerResponse[]> {
    return this.careersService.listCareers();
  }
}
