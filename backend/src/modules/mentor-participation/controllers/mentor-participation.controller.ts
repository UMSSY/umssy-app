import { Body, Controller, Get, Headers, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ZodValidationPipe } from 'nestjs-zod';
import { CurrentUser } from '../../../common/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import type { AuthenticatedUser } from '../../../common/types/authenticated-user.types.js';
import { participationPreferencesSchema, type ParticipationPreferencesDto } from '../requests/participation-preferences.schema.js';
import { MentorParticipationService } from '../services/mentor-participation.service.js';

@Controller('mentor-participation')
@UseGuards(JwtAuthGuard)
export class MentorParticipationController {
  constructor(private readonly service: MentorParticipationService) {}

  @Get('capacity')
  capacity() { return this.service.capacity(); }

  @Get('me')
  me(@CurrentUser() user: AuthenticatedUser) { return this.service.me(user.id); }

  @Post('requests')
  request(@CurrentUser() user: AuthenticatedUser,
    @Headers('idempotency-key') key: string | undefined,
    @Body(new ZodValidationPipe(participationPreferencesSchema)) body: ParticipationPreferencesDto) {
    return this.service.request(user.id, body, MentorParticipationService.requireIdempotencyKey(key));
  }

  @Patch('me/preferences')
  preferences(@CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(participationPreferencesSchema)) body: ParticipationPreferencesDto) {
    return this.service.preferences(user.id, body);
  }

  @Post('me/cancel')
  cancel(@CurrentUser() user: AuthenticatedUser) { return this.service.cancel(user.id); }

  @Post('offers/:id/confirm')
  confirm(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.service.confirm(user.id, id);
  }

  @Post('me/leave')
  leave(@CurrentUser() user: AuthenticatedUser) { return this.service.leave(user.id); }
}
