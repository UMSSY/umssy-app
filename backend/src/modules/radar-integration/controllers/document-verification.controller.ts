import {
  BadRequestException,
  Body,
  ConflictException,
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
import { DocumentVerificationRepository } from '../repositories/document-verification.repository.js';
import { DocumentReviewDecisionService } from '../services/document-review-decision.service.js';
import { DocumentReviewService } from '../services/document-review.service.js';
import { documentReviewDecisionSchema } from '../requests/radar-review.request.js';
import {
  documentAcknowledgementSchema,
  documentReviewFilterSchema,
  type DocumentAcknowledgementRequest,
  type DocumentReviewFilter,
} from '../requests/document-verification.request.js';

@Controller()
@UseGuards(JwtAuthGuard)
export class DocumentVerificationController {
  constructor(
    private readonly store: DocumentVerificationRepository,
    private readonly service: DocumentReviewService,
    private readonly decisionService: DocumentReviewDecisionService,
  ) {}

  @Get('profile/me/document-verifications')
  history(@CurrentUserId() owner: string) {
    return this.service.history(owner);
  }

  @Patch('profile/me/document-verifications/:id/notification')
  async acknowledge(
    @CurrentUserId() owner: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new RequestValidationPipe(documentAcknowledgementSchema))
    body: DocumentAcknowledgementRequest,
  ) {
    return this.service.acknowledge(owner, id, body.status);
  }

  @Get('profile/me/document-verifications/:id/file')
  preview(
    @CurrentUserId() owner: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.file(id, owner);
  }

  @UseGuards(RolesGuard)
  @Roles('administrativo')
  @Get('radar-document-reviews')
  queue(
    @Query('filter', new RequestValidationPipe(documentReviewFilterSchema))
    filter: DocumentReviewFilter,
  ) {
    return this.service.reviews(filter);
  }

  @UseGuards(RolesGuard)
  @Roles('administrativo')
  @Get('radar-document-reviews/operations/:operationId')
  operationStatus(
    @CurrentUserId() admin: string,
    @Param('operationId', ParseUUIDPipe) operationId: string,
  ) {
    return this.decisionService.operationStatus(admin, operationId);
  }

  @UseGuards(RolesGuard)
  @Roles('administrativo')
  @Get('radar-document-reviews/:id/file')
  adminPreview(@Param('id', ParseUUIDPipe) id: string) {
    return this.file(id);
  }

  @UseGuards(RolesGuard)
  @Roles('administrativo')
  @Patch('radar-document-reviews/:id')
  async decide(
    @CurrentUserId() admin: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: unknown,
  ) {
    const payload =
      typeof body === 'object' && body !== null
        ? (body as Record<string, unknown>)
        : {};
    const decision = payload.decision;

    if (decision === 'reprocess' || decision === 'revoke') {
      if (!(await this.store.revise(admin, id, decision))) {
        throw new ConflictException('Esta version ya cambio.');
      }
      return { id };
    }

    const parsed = documentReviewDecisionSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException('Decision u operationId invalido.');
    }

    return this.decisionService.decide(
      admin,
      id,
      parsed.data.operationId,
      parsed.data.decision,
    );
  }

  private async file(id: string, owner?: string) {
    const row = await this.service.file(id, owner);
    return new StreamableFile(Buffer.from(row.content), {
      type: row.mime,
      disposition: 'inline',
    });
  }
}
