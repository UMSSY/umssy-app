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

@Controller()
@UseGuards(JwtAuthGuard)
export class DocumentVerificationController {
  constructor(private readonly store: DocumentVerificationRepository) {}
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
    @Body('decision') decision: unknown,
  ) {
    if (decision === 'reprocess' || decision === 'revoke') {
      if (!(await this.store.revise(admin, id, decision)))
        throw new ConflictException('Esta versión ya cambió.');
      return { id };
    }
    if (decision !== 'approved' && decision !== 'rejected')
      throw new BadRequestException('Decisión inválida');
    if (!(await this.store.decide(admin, id, decision === 'approved')))
      throw new ConflictException(
        'La versión ya tiene una decisión o fue reemplazada.',
      );
    return { id };
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
