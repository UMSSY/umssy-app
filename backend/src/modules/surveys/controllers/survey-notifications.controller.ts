import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUserId } from '../../../common/decorators/current-user-id.decorator.js';
import { Roles } from '../../../common/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../../common/guards/roles.guard.js';
import type { SurveyNotificationResponse } from '../responses/survey-notification.response.js';
import { SurveysService } from '../services/surveys.service.js';

@ApiTags('Encuestas')
@Controller('surveys/notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('titulado', 'administrativo')
export class SurveyNotificationsController {
  constructor(private readonly surveysService: SurveysService) {}

  @Get()
  @ApiOperation({ summary: 'Obtiene las notificaciones de encuestas asignadas al usuario actual' })
  @ApiOkResponse({ description: 'Listado de avisos de encuestas con estado clasificado automáticamente' })
  getNotifications(@CurrentUserId() userId: string): Promise<SurveyNotificationResponse[]> {
    return this.surveysService.getNotificationsForUser(userId);
  }
}
