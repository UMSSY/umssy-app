import { Body, Controller, Get, Headers, Param, Post, StreamableFile, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { CurrentUserId } from '../../../common/decorators/current-user-id.decorator.js';
import { Roles } from '../../../common/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../../common/guards/roles.guard.js';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe.js';
import type { MulterFile } from '../../../common/types/multer-file.type.js';
import { GetEventIdSchema } from '../requests/get-event-id.request.js';
import { EventProposalsService } from '../services/event-proposals.service.js';

@ApiTags('Event proposals')
@Controller()
export class EventProposalsController {
  constructor(private readonly proposals: EventProposalsService) {}

  @Post('event-proposals')
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('titulado')
  @UseInterceptors(FileInterceptor('cover', { limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 9, fieldSize: 10000 } }))
  create(@CurrentUserId() userId: string, @Body() body: unknown, @UploadedFile() file: MulterFile | undefined, @Headers('idempotency-key') key: string | undefined) {
    return this.proposals.create(userId, body, file, key);
  }

  @Get('events/:id/cover')
  async cover(@Param('id', new ZodValidationPipe(GetEventIdSchema)) id: string) {
    const image = await this.proposals.cover(id);
    return new StreamableFile(image.content, { type: image.mimeType, disposition: 'inline', length: image.content.length });
  }
}
