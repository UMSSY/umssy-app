import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ZodValidationPipe } from 'nestjs-zod';
import { CurrentUser } from '../../../common/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { ResponseInterceptor } from '../../../common/interceptors/index.js';
import type { AuthenticatedUser } from '../../../common/types/authenticated-user.types.js';
import {
  createMentorParticipationSchema,
  type CreateMentorParticipationDto,
} from '../requests/create-mentor-participation.schema.js';
import { MentorParticipationService } from '../services/mentor-participation.service.js';

@Controller('mentor-participation/requests')
@UseGuards(JwtAuthGuard)
@UseInterceptors(ResponseInterceptor)
export class MentorParticipationController {
  constructor(private readonly service: MentorParticipationService) {}

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(createMentorParticipationSchema))
    body: CreateMentorParticipationDto,
  ) {
    return this.service.create(user.id, body);
  }

  @Get('me')
  findMyRequest(@CurrentUser() user: AuthenticatedUser) {
    return this.service.findMyRequest(user.id);
  }

  @Get('me/history')
  findMyHistory(@CurrentUser() user: AuthenticatedUser) {
    return this.service.findMyHistory(user.id);
  }

  @Patch('me')
  updatePreferences(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(createMentorParticipationSchema))
    body: CreateMentorParticipationDto,
  ) {
    return this.service.updatePreferences(user.id, body);
  }

  @Delete('me')
  cancel(@CurrentUser() user: AuthenticatedUser) {
    return this.service.cancel(user.id);
  }
}
