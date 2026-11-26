import { documentRadarEndpoint } from '../utils/document-radar-endpoint.js';
import {
  radarResponseSchema,
  radarSimulationEligibilitySchema,
  cvRescanResponseSchema,
  reviewQueueResponseSchema,
  radarReviewOperationResponseSchema,
  radarNotificationsResponseSchema,
  openedRadarNotificationResponseSchema,
} from '../responses/radar-api.response.js';
import {
  Body,
  Controller,
  Get,
  Header,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import { CurrentUserId } from '../../../common/decorators/current-user-id.decorator.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../../common/guards/roles.guard.js';
import { Roles } from '../../../common/decorators/roles.decorator.js';
import { RadarIntegrationService } from '../services/radar-integration.service.js';
import { RequestValidationPipe } from '../../../common/pipes/request-validation.pipe.js';
import { toApiBody } from '../../../common/utils/to-api-body.js';
import {
  reviewKindSchema,
  reviewDecisionSchema,
  type ReviewDecisionRequest,
  type ReviewKind,
} from '../requests/radar-review.request.js';

@ApiTags('radar')
@ApiBearerAuth()
@Controller()
@UseGuards(JwtAuthGuard)
export class RadarIntegrationController {
  constructor(private readonly svc: RadarIntegrationService) {}
  @documentRadarEndpoint({
    operationId: 'getMyRadar',
    summary: 'Consultar radar publicado',
    description:
      'Devuelve la última publicación y la anterior, con revisiones, evidencias y estado de procesamiento. Requiere sesión del titular.',
    response: radarResponseSchema,
  })
  @Get('profile/me/radar')
  me(@CurrentUserId() user: string) {
    return this.svc.myRadar(user);
  }
  @documentRadarEndpoint({
    operationId: 'getMyRadarSimulationEligibility',
    summary: 'Consultar elegibilidad para simulaciones',
    description:
      'Devuelve habilidades aprobadas y habilidades pendientes elegibles para la bonificaci\u00f3n de relevancia.',
    response: radarSimulationEligibilitySchema,
  })
  @Header('Cache-Control', 'no-store')
  @Get('profile/me/radar/simulation-eligibility')
  simulationEligibility(@CurrentUserId() user: string) {
    return this.svc.simulationEligibility(user);
  }

  @documentRadarEndpoint({
    operationId: 'getMyHistoricalRadar',
    summary: 'Consultar publicacion historica',
    description:
      'Devuelve una instantanea del titular autenticado y su version anterior. Una instantanea ajena o inexistente devuelve 404.',
    response: radarResponseSchema,
    errors: [400, 404],
    parameters: ['id'],
  })
  @Get('profile/me/radar/snapshots/:id')
  historical(
    @CurrentUserId() user: string,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.svc.historicalRadar(user, id);
  }
  @documentRadarEndpoint({
    operationId: 'getMyRadarNotifications',
    summary: 'Consultar notificaciones del radar',
    description:
      'Devuelve las notificaciones del titular, ordenadas por fecha descendente.',
    response: radarNotificationsResponseSchema,
  })
  @Get('profile/me/radar/notifications')
  notifications(@CurrentUserId() user: string) {
    return this.svc.notificationsList(user);
  }
  @documentRadarEndpoint({
    operationId: 'openMyRadarNotification',
    summary: 'Abrir publicación notificada',
    description:
      'Consulta la publicación histórica del titular y marca su notificación como leída.',
    response: openedRadarNotificationResponseSchema,
    status: 201,
    errors: [400, 404],
    parameters: ['id'],
  })
  @Post('profile/me/radar/notifications/:id/open')
  openNotification(
    @CurrentUserId() user: string,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.svc.openNotification(user, id);
  }
  @documentRadarEndpoint({
    operationId: 'rescanMyRadarCv',
    summary: 'Reanalizar CV vigente',
    description:
      'Reprocesa el CV vigente del titular; devuelve los estados de extracción, revisión y NLP.',
    response: cvRescanResponseSchema,
    status: 201,
    errors: [404, 403],
  })
  @Post('profile/me/radar/cv-rescans')
  rescan(@CurrentUserId() user: string) {
    return this.svc.rescanCurrentCv(user);
  }
  @documentRadarEndpoint({
    operationId: 'recalculateMyRadar',
    summary: 'Recalcular radar',
    description:
      'Actualiza NLP y publica el radar del titular. Si el análisis no est? listo devuelve conflicto.',
    response: radarResponseSchema,
    status: 201,
    errors: [409],
  })
  @Post('profile/me/radar/recalculations')
  recalculate(@CurrentUserId() user: string) {
    return this.svc.retry(user);
  }
  @UseGuards(RolesGuard)
  @Roles('administrativo')
  @documentRadarEndpoint({
    operationId: 'getRadarReviewQueue',
    summary: 'Consultar evidencias pendientes',
    description:
      'Requiere rol administrativo. Lista completa de CV y habilidades pendientes, ordenada por fecha descendente.',
    response: reviewQueueResponseSchema,
    errors: [403],
  })
  @Get('radar-reviews')
  queue(@CurrentUserId() admin: string) {
    return this.svc.queue(admin);
  }
  @UseGuards(RolesGuard)
  @Roles('administrativo')
  @documentRadarEndpoint({
    operationId: 'getRadarReviewOperation',
    summary: 'Recuperar decisión administrativa',
    description:
      'Devuelve el resultado de una operación completada por el administrador autenticado.',
    response: radarReviewOperationResponseSchema,
    errors: [400, 403, 404],
    parameters: ['operationId'],
  })
  @Get('radar-reviews/operations/:operationId')
  operationStatus(
    @CurrentUserId() admin: string,
    @Param('operationId', new ParseUUIDPipe()) operationId: string,
  ) {
    return this.svc.operationStatus(admin, operationId);
  }
  @UseGuards(RolesGuard)
  @Roles('administrativo')
  @ApiBody(toApiBody(reviewDecisionSchema))
  @documentRadarEndpoint({
    operationId: 'decideRadarEvidence',
    summary: 'Resolver evidencia',
    description:
      'Requiere rol administrativo. Resuelve una evidencia con un identificador de operación que permite recuperar el resultado sin repetir la decisión.',
    response: radarReviewOperationResponseSchema,
    errors: [400, 403, 404, 409],
    parameters: ['kind', 'id'],
  })
  @Patch('radar-reviews/:kind/:id')
  decision(
    @CurrentUserId() admin: string,
    @Param('kind', new RequestValidationPipe(reviewKindSchema))
    kind: ReviewKind,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body(new RequestValidationPipe(reviewDecisionSchema))
    body: ReviewDecisionRequest,
  ) {
    return this.svc.decision(admin, kind, id, body.decision, body.operationId);
  }

  @UseGuards(RolesGuard)
  @Roles('administrativo')
  @documentRadarEndpoint({
    operationId: 'reprocessRadarCv',
    summary: 'Reprocesar CV',
    description:
      'Requiere rol administrativo. Reprocesa la extracción del CV identificado.',
    response: cvRescanResponseSchema,
    status: 201,
    errors: [400, 403, 404],
    parameters: ['id'],
  })
  @Post('radar-reviews/cvs/:id/reprocessings')
  reprocessCv(
    @CurrentUserId() admin: string,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.svc.reprocessCv(admin, id);
  }
  @UseGuards(RolesGuard)
  @Roles('administrativo')
  @documentRadarEndpoint({
    operationId: 'previewRadarCv',
    summary: 'Consultar respaldo del CV',
    description:
      'Requiere rol administrativo. Devuelve PDF para vista previa y registra la consulta.',
    binary: true,
    mime: 'application/pdf',
    errors: [400, 403, 404],
    parameters: ['id'],
  })
  @Get('radar-reviews/cvs/:id/file')
  async download(
    @CurrentUserId() admin: string,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    const f = await this.svc.downloadForAdmin(admin, id);
    return new StreamableFile(f.buffer, {
      type: 'application/pdf',
      disposition: 'inline; filename="documento.pdf"',
    });
  }
}
