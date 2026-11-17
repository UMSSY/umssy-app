import { documentRadarEndpoint } from '../utils/document-radar-endpoint.js';
import {
  radarResponseSchema,
  cvRescanResponseSchema,
  reviewQueueResponseSchema,
} from '../responses/radar-api.response.js';
import {
  Body,
  Controller,
  Get,
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
  @ApiBody(toApiBody(reviewDecisionSchema))
  @documentRadarEndpoint({
    operationId: 'decideRadarEvidence',
    summary: 'Resolver evidencia',
    description:
      'Requiere rol administrativo. Aprueba, rechaza o revoca una evidencia y devuelve el radar actualizado.',
    response: radarResponseSchema,
    errors: [400, 403, 404],
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
    return this.svc.decision(admin, kind, id, body.decision);
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
