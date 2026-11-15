import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Get,
  NotFoundException,
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
import { DocumentVerificationRepository } from '../repositories/document-verification.repository.js';
import { DocumentReviewDecisionService } from '../services/document-review-decision.service.js';
import { documentReviewDecisionSchema } from '../requests/radar-review.request.js';

@Controller()
@UseGuards(JwtAuthGuard)
export class DocumentVerificationController {
  constructor(
    private readonly store: DocumentVerificationRepository,
    private readonly decisionService: DocumentReviewDecisionService,
  ) {}
  @Get('profile/me/document-verifications')
  history(@CurrentUserId() owner: string) {
    return this.store.history(owner);
  }
  @Patch('profile/me/document-verifications/:id/notification')
  async acknowledge(
    @CurrentUserId() owner: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: unknown,
  ) {
    if (typeof status !== 'string') throw new BadRequestException();
    await this.store.acknowledge(owner, id, status);
    return { id };
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
  queue(@Query('filter') filter = 'pending') {
    if (!['pending', 'approved', 'rejected', 'all'].includes(filter))
      throw new BadRequestException('Filtro inválido');
    return this.store.reviews(filter);
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
      if (!(await this.store.revise(admin, id, decision)))
        throw new ConflictException('Esta version ya cambio.');
      return { id };
    }

    const parsed = documentReviewDecisionSchema.safeParse(body);
    if (!parsed.success)
      throw new BadRequestException('Decision u operationId invalido.');

    return this.decisionService.decide(
      admin,
      id,
      parsed.data.operationId,
      parsed.data.decision,
    );
  }
  private async file(id: string, owner?: string) {
    const [row] = await this.store.file(id, owner);
    if (!row) throw new NotFoundException('El archivo no está disponible.');
    return new StreamableFile(Buffer.from(row.content), {
      type: row.mime,
      disposition: 'inline',
    });
  }
}
