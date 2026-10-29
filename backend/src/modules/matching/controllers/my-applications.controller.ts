import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiNoContentResponse,
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
import { JobApplicationNotFoundException } from '../exceptions/job-application-not-found.exception.js';
import { MyApplicationsService } from '../services/my-applications.service.js';
import type { MyApplicationResponse } from '../types/my-applications.types.js';

const applicationIdPipe = new ParseUUIDPipe({
  exceptionFactory: () => new JobApplicationNotFoundException(),
});

@ApiTags('job-applications')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'A valid access token is required' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('titulado', 'estudiante')
@Controller('applications')
export class MyApplicationsController {
  constructor(private readonly myApplicationsService: MyApplicationsService) {}

  @Get('me')
  @ApiOperation({ summary: 'Lista las postulaciones del usuario autenticado' })
  @ApiOkResponse({
    description: 'Postulaciones con afinidad y estado, de la más reciente a la más antigua',
  })
  listMine(@CurrentUserId() userId: string): Promise<MyApplicationResponse[]> {
    return this.myApplicationsService.listMine(userId);
  }

  @Patch(':id/withdraw')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Retira una postulación propia en revisión o entrevista' })
  @ApiNoContentResponse({ description: 'Postulación retirada' })
  @ApiNotFoundResponse({ description: 'La postulación no existe o no es del usuario' })
  @ApiConflictResponse({ description: 'La postulación ya no se puede retirar' })
  withdraw(
    @Param('id', applicationIdPipe) applicationId: string,
    @CurrentUserId() userId: string,
  ): Promise<void> {
    return this.myApplicationsService.withdraw(userId, applicationId);
  }
}
