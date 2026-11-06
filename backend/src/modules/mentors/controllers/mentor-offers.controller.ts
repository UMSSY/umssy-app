import { Controller, Param, ParseUUIDPipe, Post, UseGuards, UseInterceptors } from '@nestjs/common';
import { CurrentUser } from '../../../common/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { ResponseInterceptor } from '../../../common/interceptors/index.js';
import type { AuthenticatedUser } from '../../../common/types/authenticated-user.types.js';
import { MentorOffersService } from '../services/mentor-offers.service.js';

@Controller('mentors/offers')
@UseGuards(JwtAuthGuard)
@UseInterceptors(ResponseInterceptor)
export class MentorOffersController {
  constructor(private readonly service: MentorOffersService) {}

  @Post(':offerId/confirm')
  confirm(@CurrentUser() user: AuthenticatedUser,
    @Param('offerId', new ParseUUIDPipe({ version: '4' })) offerId: string) {
    return this.service.confirm(user.id, offerId);
  }
}
