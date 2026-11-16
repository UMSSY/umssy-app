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
import { DocumentVerificationService } from '../services/document-verification.service.js';

@Controller()
@UseGuards(JwtAuthGuard)
export class DocumentVerificationController {
  constructor(private readonly store: DocumentVerificationService) {}
  @Get('profile/me/document-verifications')
  history(@CurrentUserId() owner: string) {
    return this.store.history(owner);
  }
  @Patch('profile/me/document-verifications/:id/notification')
  async acknowledge(
    @CurrentUserId() owner: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: unknown,
  ) {
    return this.store.acknowledge(owner, id, body);
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
  queue(@Query() query: unknown) {
    return this.store.reviews(query);
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
    return this.store.decide(admin, id, body);
  }
  private async file(id: string, owner?: string) {
    const row = await this.store.file(id, owner);
    return new StreamableFile(Buffer.from(row.content), {
      type: row.mime,
      disposition: 'inline',
    });
  }
}
