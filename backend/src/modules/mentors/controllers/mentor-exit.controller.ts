import { Controller, Post, UseGuards, UseInterceptors } from '@nestjs/common';
import { CurrentUser } from '../../../common/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { ResponseInterceptor } from '../../../common/interceptors/index.js';
import type { AuthenticatedUser } from '../../../common/types/authenticated-user.types.js';
import { MentorExitRepository } from '../repositories/mentor-exit.repository.js';

@Controller('mentors/me')
@UseGuards(JwtAuthGuard)
@UseInterceptors(ResponseInterceptor)
export class MentorExitController {
  constructor(private readonly repository: MentorExitRepository) {}

  @Post('leave')
  leave(@CurrentUser() user: AuthenticatedUser) {
    return this.repository.leave(user.id);
  }
}
