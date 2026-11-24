import { mentorApiOperation } from '../decorators/mentor-api-operation.decorator.js';
import { MENTOR_API_SCHEMAS } from '../responses/mentor-openapi.response.js';
import { ApiTags, ApiParam } from '@nestjs/swagger';
import {
  Controller,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { CurrentUser } from '../../../common/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { ResponseInterceptor } from '../../../common/interceptors/index.js';
import type { AuthenticatedUser } from '../../../common/types/authenticated-user.types.js';
import { MentorOffersService } from '../services/mentor-offers.service.js';

@ApiTags('mentors')
@Controller('mentors/offers')
@UseGuards(JwtAuthGuard)
@UseInterceptors(ResponseInterceptor)
export class MentorOffersController {
  constructor(private readonly service: MentorOffersService) {}

  @mentorApiOperation({
    operationId: 'confirmMentorSlotOffer',
    summary: 'Confirmar oferta de cupo',
    description:
      'Sesión y elegibilidad de titulado. Oferta propia; 404 ausente o falta catálogo mentor; 400 selecciones inválidas; 409 oferta no vigente (MENTOR_OFFER_ERROR) o ALREADY_MENTOR. Repetir confirmación devuelve alreadyConfirmed=true.',
    data: MENTOR_API_SCHEMAS.confirmation,
    example: {
      id: '7dd01892-ef53-456b-8e5c-fde35324dc18',
      status: 'ACTIVE',
      alreadyConfirmed: false,
    },
    auth: true,
    errors: [400, 404, 409],
    status: 201,
  })
  @ApiParam({
    name: 'offerId',
    description: 'UUID v4.',
    schema: {
      type: 'string',
      format: 'uuid',
      example: '7dd01892-ef53-456b-8e5c-fde35324dc18',
    },
  })
  @Post(':offerId/confirm')
  confirm(
    @CurrentUser() user: AuthenticatedUser,
    @Param('offerId', new ParseUUIDPipe({ version: '4' })) offerId: string,
  ) {
    return this.service.confirm(user.id, offerId);
  }
}
