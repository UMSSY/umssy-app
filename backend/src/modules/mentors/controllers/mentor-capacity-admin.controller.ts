import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
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
@ApiBearerAuth()
@ApiResponse({ status: 401, description: 'Sesión ausente o inválida.' })
@ApiResponse({ status: 403, description: 'Se requiere el rol administrativo y una cuenta habilitada.' })
@Controller('admin/mentor-capacity')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(ResponseInterceptor)
@Roles('administrativo')
export class MentorCapacityAdminController {
  constructor(private readonly service: MentorCapacityAdminService) {}

  @ApiOperation({ operationId: 'getMentorCapacityOverview', summary: 'Consultar cupos', description: 'Requiere rol administrativo. Lectura sin reconciliación ni escrituras.' })
  @ApiResponse({ status: 200, description: 'Resumen en data: percentage, approvedGraduates, activeMentors, reservedOffers, capacity, occupied, available y pendingRequests.' })
  @Get()
  getOverview() {
    return this.service.getOverview();
  }

  @ApiOperation({ operationId: 'updateMentorCapacityPercentage', summary: 'Actualizar porcentaje máximo', description: 'Requiere rol administrativo. Actualiza y reconcilia ofertas FIFO en una transacción; conserva participaciones y reservas vigentes.' })
  @ApiBody(toApiBody(updateMentorCapacitySchema))
  @ApiResponse({ status: 200, description: 'Resumen actualizado bajo el envoltorio estándar de respuesta.' })
  @ApiResponse({ status: 400, description: 'El cuerpo debe contener únicamente percentage, entero entre 1 y 100.' })
  @Put()
  updatePercentage(
    @Body(new ZodValidationPipe(updateMentorCapacitySchema))
    body: UpdateMentorCapacityDto,
  ) {
    return this.service.updatePercentage(body.percentage);
  }

  @ApiOperation({ operationId: 'listMentorCapacityWaitingRequests', summary: 'Solicitudes PENDING ordenadas por queuedAt ASC e id ASC.', description: 'Requiere rol administrativo. Paginación sin escrituras.' })
  @ApiQuery({ name: 'page', required: false, schema: { type: 'integer', minimum: 1, default: 1 } })
  @ApiQuery({ name: 'limit', required: false, schema: { type: 'integer', minimum: 1, maximum: 50, default: 10 } })
  @ApiResponse({ status: 200, description: 'data contiene items, totalItems, page, limit y totalPages.' })
  @ApiResponse({ status: 400, description: 'Parámetros de paginación inválidos.' })
  @Get('requests')
  listWaitingRequests(
    @Query(new ZodValidationPipe(mentorCapacityListSchema))
    query: MentorCapacityListQuery,
  ) {
    return this.service.listWaitingRequests(query.page, query.limit);
  }

  @ApiOperation({ operationId: 'listMentorCapacityOfferHistory', summary: 'Ofertas ordenadas por offeredAt DESC e id DESC; confirmedAt puede ser null.', description: 'Requiere rol administrativo. Paginación sin escrituras.' })
  @ApiQuery({ name: 'page', required: false, schema: { type: 'integer', minimum: 1, default: 1 } })
  @ApiQuery({ name: 'limit', required: false, schema: { type: 'integer', minimum: 1, maximum: 50, default: 10 } })
  @ApiResponse({ status: 200, description: 'data contiene items, totalItems, page, limit y totalPages.' })
  @ApiResponse({ status: 400, description: 'Parámetros de paginación inválidos.' })
  @Get('offers')
  listOfferHistory(
    @Query(new ZodValidationPipe(mentorCapacityListSchema))
    query: MentorCapacityListQuery,
  ) {
    return this.service.listOfferHistory(query.page, query.limit);
  }
}
