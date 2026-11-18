import { ApiBearerAuth, ApiBody, ApiQuery, ApiTags } from '@nestjs/swagger';
import { toApiBody } from '../../../common/utils/to-api-body.js';
import { documentRadarEndpoint } from '../utils/document-radar-endpoint.js';
import {
  documentHistoryResponseSchema,
  documentDecisionResponseSchema,
  documentMutationResponseSchema,
  radarReviewOperationResponseSchema,
} from '../responses/radar-api.response.js';
import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import { CurrentUserId } from '../../../common/decorators/current-user-id.decorator.js';
import { Roles } from '../../../common/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../../common/guards/roles.guard.js';
import { RequestValidationPipe } from '../../../common/pipes/request-validation.pipe.js';
import { DocumentReviewDecisionService } from '../services/document-review-decision.service.js';
import { DocumentReviewService } from '../services/document-review.service.js';
import type { DocumentDecisionRequest } from '../types/document-decision-request.types.js';
import {
  documentDecisionSchema,
  documentAcknowledgementSchema,
  documentReviewFilterSchema,
} from '../requests/document-verification.request.js';
import type { DocumentAcknowledgementRequest } from '../types/document-acknowledgement-request.types.js';
import type { DocumentReviewFilter } from '../types/document-review-filter.types.js';

@ApiTags('radar-documents')
@ApiBearerAuth()
@Controller()
@UseGuards(JwtAuthGuard)
export class DocumentVerificationController {
  constructor(
    private readonly service: DocumentReviewService,
    private readonly decisionService: DocumentReviewDecisionService,
  ) {}

  @documentRadarEndpoint({
    operationId: 'getMyDocumentVerifications',
    summary: 'Consultar verificaciones',
    description:
      'Historial completo del titular, ordenado por fecha e identificador descendentes. Incluye versiones reemplazadas.',
    response: documentHistoryResponseSchema,
  })
  @Get('profile/me/document-verifications')
  history(@CurrentUserId() owner: string) {
    return this.service.history(owner);
  }
  @documentRadarEndpoint({
    operationId: 'acknowledgeDocumentVerification',
    summary: 'Marcar resultado como leído',
    description:
      'Solo el titular puede reconocer el resultado de la versión y estado enviados. Una versión obsoleta devuelve conflicto.',
    response: documentMutationResponseSchema,
    errors: [400, 409],
    parameters: ['id'],
  })
  @ApiBody(toApiBody(documentAcknowledgementSchema))
  @Patch('profile/me/document-verifications/:id/notification')
  async acknowledge(
    @CurrentUserId() owner: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new RequestValidationPipe(documentAcknowledgementSchema))
    body: DocumentAcknowledgementRequest,
  ) {
    return this.service.acknowledge(owner, id, body.status);
  }
  @documentRadarEndpoint({
    operationId: 'previewMyVerificationFile',
    summary: 'Consultar mi respaldo',
    description:
      'Solo permite abrir el respaldo perteneciente al titular autenticado. Conserva el tipo MIME del archivo.',
    binary: true,
    mime: 'application/octet-stream',
    errors: [400, 404],
    parameters: ['id'],
  })
  @Get('profile/me/document-verifications/:id/file')
  preview(
    @CurrentUserId() owner: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.file(id, owner);
  }

  @UseGuards(RolesGuard)
  @Roles('administrativo')
  @documentRadarEndpoint({
    operationId: 'getDocumentReviewQueue',
    summary: 'Consultar revisión documental',
    description:
      'Requiere rol administrativo. Devuelve versiones activas, filtradas por estado y ordenadas por fecha descendente, sin paginación.',
    response: documentHistoryResponseSchema,
    errors: [400, 403],
  })
  @ApiQuery({
    name: 'filter',
    required: false,
    enum: ['pending', 'approved', 'rejected', 'all'],
    example: 'pending',
    description: 'Filtro por estado; predeterminado: pending.',
  })
  @Get('radar-document-reviews')
  queue(
    @Query('filter', new RequestValidationPipe(documentReviewFilterSchema))
    filter: DocumentReviewFilter,
  ) {
    return this.service.reviews(filter);
  }

  @UseGuards(RolesGuard)
  @Roles('administrativo')
  @documentRadarEndpoint({
    operationId: 'getDocumentReviewOperation',
    summary: 'Recuperar decisión documental',
    description:
      'Devuelve el resultado de una revisión completada por el administrador autenticado.',
    response: radarReviewOperationResponseSchema,
    errors: [400, 403, 404],
    parameters: ['operationId'],
  })
  @Get('radar-document-reviews/operations/:operationId')
  operationStatus(
    @CurrentUserId() admin: string,
    @Param('operationId', ParseUUIDPipe) operationId: string,
  ) {
    return this.decisionService.operationStatus(admin, operationId);
  }

  @UseGuards(RolesGuard)
  @Roles('administrativo')
  @documentRadarEndpoint({
    operationId: 'previewDocumentReviewFile',
    summary: 'Consultar respaldo administrativo',
    description:
      'Requiere rol administrativo. Devuelve el archivo conservando su tipo MIME.',
    binary: true,
    mime: 'application/octet-stream',
    errors: [400, 403, 404],
    parameters: ['id'],
  })
  @Get('radar-document-reviews/:id/file')
  adminPreview(@Param('id', ParseUUIDPipe) id: string) {
    return this.file(id);
  }

  @UseGuards(RolesGuard)
  @Roles('administrativo')
  @documentRadarEndpoint({
    operationId: 'decideDocumentVerification',
    summary: 'Resolver verificación documental',
    description:
      'Requiere rol administrativo. Aprueba, rechaza, reprocesa o revoca según el estado y versión actuales.',
    response: documentDecisionResponseSchema,
    errors: [400, 403, 409],
    parameters: ['id'],
  })
  @ApiBody(toApiBody(documentDecisionSchema))
  @Patch('radar-document-reviews/:id')
  async decide(
    @CurrentUserId() admin: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new RequestValidationPipe(documentDecisionSchema))
    body: DocumentDecisionRequest,
  ) {
    return this.decisionService.resolve(admin, id, body);
  }

  private async file(id: string, owner?: string) {
    const row = await this.service.file(id, owner);
    return new StreamableFile(Buffer.from(row.content), {
      type: row.mime,
      disposition: 'inline',
    });
  }
}
