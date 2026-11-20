import { mentorApiOperation } from '../decorators/mentor-api-operation.decorator.js';
import { MENTOR_API_SCHEMAS } from '../responses/mentor-openapi.response.js';
import { ApiTags } from '@nestjs/swagger';
import { Controller, Post, UseGuards, UseInterceptors } from '@nestjs/common';
import { CurrentUser } from '../../../common/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { ResponseInterceptor } from '../../../common/interceptors/index.js';
import type { AuthenticatedUser } from '../../../common/types/authenticated-user.types.js';
import { MentorExitService } from '../services/mentor-exit.service.js';

@ApiTags('mentors')
@Controller('mentors/me')
@UseGuards(JwtAuthGuard)
@UseInterceptors(ResponseInterceptor)
export class MentorExitController {
  constructor(private readonly service: MentorExitService) {}

  @mentorApiOperation({
    operationId: 'leaveMentorParticipation',
    summary: 'Finalizar participación',
    description:
      'Sesión activa, cualquier rol válido. Idempotente si ya terminó. 409 MENTOR_HAS_FUTURE_APPOINTMENTS si existen citas futuras pendientes o confirmadas.',
    data: MENTOR_API_SCHEMAS.exit,
    example: {
      id: '7dd01892-ef53-456b-8e5c-fde35324dc18',
      status: 'ENDED',
      alreadyEnded: false,
    },
    auth: true,
    errors: [409],
    status: 201,
  })
  @Post('leave')
  leave(@CurrentUser() user: AuthenticatedUser) {
    return this.service.leave(user.id);
  }
}
