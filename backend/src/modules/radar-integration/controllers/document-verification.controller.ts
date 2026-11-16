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
import { DocumentReviewService } from '../services/document-review.service.js';
import { RequestValidationPipe } from '../../../common/pipes/request-validation.pipe.js';
import {
  documentDecisionSchema,
  documentAcknowledgementSchema,
  documentReviewFilterSchema,
} from '../requests/document-verification.request.js';
import type { DocumentDecisionRequest } from '../types/document-decision-request.type.js';
import type { DocumentAcknowledgementRequest } from '../types/document-acknowledgement-request.type.js';
import type { DocumentReviewFilter } from '../types/document-review-filter.type.js';

@Controller()
@UseGuards(JwtAuthGuard)
export class DocumentVerificationController {
  constructor(private readonly service: DocumentReviewService) {}
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
    @Body(new RequestValidationPipe(documentDecisionSchema))
    body: DocumentDecisionRequest,
  ) {
    return this.service.decide(admin, id, body.decision);
  }
  private async file(id: string, owner?: string) {
    const row = await this.service.file(id, owner);
    return new StreamableFile(Buffer.from(row.content), {
      type: row.mime,
      disposition: 'inline',
    });
  }
}
