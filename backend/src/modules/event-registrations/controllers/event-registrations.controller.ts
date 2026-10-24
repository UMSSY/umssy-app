import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../../common/decorators/current-user.decorator.js';
import { Roles } from '../../../common/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../../common/guards/roles.guard.js';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe.js';
import type { AuthenticatedUser } from '../../../common/types/authenticated-user.types.js';
import { SupportEventIdSchema } from '../requests/support-event-id.request.js';
import { EventRegistrationsService } from '../services/event-registrations.service.js';

@ApiTags('Event registrations')
@ApiBearerAuth()
@Controller('event-registrations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EventRegistrationsController {
  constructor(private readonly service: EventRegistrationsService) {}

  @Get('me')
  findMine(@CurrentUser() user: AuthenticatedUser) {
    return this.service.findMine(user.id);
  }

  @Get('passes/:id')
  getPassById(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.getPassById(id, user.id);
  }
}