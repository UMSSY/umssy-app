import { mentorApiOperation } from '../decorators/mentor-api-operation.decorator.js';
import { MENTOR_API_SCHEMAS } from '../responses/mentor-openapi.response.js';
import { ApiTags, ApiBody, ApiQuery } from '@nestjs/swagger';

import { toApiBody } from '../../../common/utils/to-api-body.js';
import {
  Body,
  Controller,
  Get,
  Put,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Roles } from '../../../common/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../../common/guards/roles.guard.js';
import { ResponseInterceptor } from '../../../common/interceptors/index.js';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe.js';
import {
  mentorCapacityListSchema,
  type MentorCapacityListQuery,
} from '../requests/mentor-capacity-list.schema.js';
import {
  updateMentorCapacitySchema,
  type UpdateMentorCapacityDto,
} from '../requests/update-mentor-capacity.schema.js';
import { MentorCapacityAdminService } from '../services/mentor-capacity-admin.service.js';

@ApiTags('mentor-capacity')
@Controller('admin/mentor-capacity')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(ResponseInterceptor)
@Roles('administrativo')
export class MentorCapacityAdminController {
  constructor(private readonly service: MentorCapacityAdminService) {}

  @mentorApiOperation({
    operationId: 'getMentorCapacityOverview',
    summary: 'Consultar cupos',
    description:
      'Rol administrativo. Lectura sin reconciliación ni escrituras.',
    data: MENTOR_API_SCHEMAS.overview,
    example: {
      percentage: 40,
      approvedGraduates: 10,
      activeMentors: 2,
      reservedOffers: 1,
      capacity: 4,
      occupied: 3,
      available: 1,
      pendingRequests: 1,
    },
    auth: true,
    errors: [],
    status: 200,
  })
  @Get()
  getOverview() {
    return this.service.getOverview();
  }

  @mentorApiOperation({
    operationId: 'updateMentorCapacityPercentage',
    summary: 'Actualizar porcentaje máximo',
    description:
      'Rol administrativo. Actualiza y reconcilia FIFO en una transacción; conserva participaciones y reservas vigentes.',
    data: MENTOR_API_SCHEMAS.overview,
    example: {
      percentage: 40,
      approvedGraduates: 10,
      activeMentors: 2,
      reservedOffers: 1,
      capacity: 4,
      occupied: 3,
      available: 1,
      pendingRequests: 1,
    },
    auth: true,
    errors: [400],
    status: 200,
  })
  @ApiBody(toApiBody(updateMentorCapacitySchema))
  @Put()
  updatePercentage(
    @Body(new ZodValidationPipe(updateMentorCapacitySchema))
    body: UpdateMentorCapacityDto,
  ) {
    return this.service.updatePercentage(body.percentage);
  }

  @mentorApiOperation({
    operationId: 'listMentorCapacityWaitingRequests',
    summary: 'Listar solicitudes pendientes',
    description:
      'Rol administrativo. PENDING por queuedAt ASC e ID ASC. Paginación sin escrituras.',
    data: MENTOR_API_SCHEMAS.waiting,
    example: { items: [], totalItems: 0, page: 1, limit: 10, totalPages: 0 },
    auth: true,
    errors: [400],
    status: 200,
  })
  @ApiQuery({
    name: 'page',
    required: false,
    schema: { type: 'integer', minimum: 1, default: 1 },
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    schema: { type: 'integer', minimum: 1, maximum: 50, default: 10 },
  })
  @Get('requests')
  listWaitingRequests(
    @Query(new ZodValidationPipe(mentorCapacityListSchema))
    query: MentorCapacityListQuery,
  ) {
    return this.service.listWaitingRequests(query.page, query.limit);
  }

  @mentorApiOperation({
    operationId: 'listMentorCapacityOfferHistory',
    summary: 'Consultar historial de ofertas',
    description:
      'Rol administrativo. offeredAt DESC e ID DESC; confirmedAt nullable. Paginación sin escrituras.',
    data: MENTOR_API_SCHEMAS.offers,
    example: { items: [], totalItems: 0, page: 1, limit: 10, totalPages: 0 },
    auth: true,
    errors: [400],
    status: 200,
  })
  @ApiQuery({
    name: 'page',
    required: false,
    schema: { type: 'integer', minimum: 1, default: 1 },
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    schema: { type: 'integer', minimum: 1, maximum: 50, default: 10 },
  })
  @Get('offers')
  listOfferHistory(
    @Query(new ZodValidationPipe(mentorCapacityListSchema))
    query: MentorCapacityListQuery,
  ) {
    return this.service.listOfferHistory(query.page, query.limit);
  }
}
