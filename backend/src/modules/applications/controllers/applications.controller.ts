import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  ParseUUIDPipe,
  UseGuards,
  UsePipes,
  StandardSchemaValidationPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUserId } from '../../../common/decorators/current-user-id.decorator.js';
import { Roles } from '../../../common/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../../common/guards/roles.guard.js';
import { buildRequestValidationException } from '../../../common/utils/build-request-validation-exception.js';
import { ApplicationsService } from '../services/applications.service.js';
import { ApplicationNotFoundException } from '../exceptions/application-not-found.exception.js';
import {
  findApplicationsQuerySchema,
  type FindApplicationsQueryDto,
} from '../requests/find-applications.request.js';

const applicationIdPipe = new ParseUUIDPipe({
  exceptionFactory: () => new ApplicationNotFoundException(),
});

@ApiTags('applications')
@ApiBearerAuth()
@ApiUnauthorizedResponse({
  description: 'Se requiere un token de acceso válido',
})
@Controller('applications')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('titulado', 'estudiante')
@UsePipes(
  new StandardSchemaValidationPipe({
    exceptionFactory: buildRequestValidationException,
  }),
)
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Get('me')
  findMyApplications(
    @CurrentUserId() userId: string,
    @Query({ schema: findApplicationsQuerySchema })
    query: FindApplicationsQueryDto,
  ) {
    return this.applicationsService.findMyApplications(userId, query);
  }

  @Patch(':id/reactivate')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Reactiva una postulación retirada',
    operationId: 'reactivateApplication',
  })
  @ApiParam({ name: 'id', description: 'UUID de la postulación', type: String })
  @ApiNoContentResponse({
    description: 'Postulación reactivada correctamente',
  })
  @ApiForbiddenResponse({
    description: 'El usuario no tiene permisos sobre la postulación',
  })
  @ApiNotFoundResponse({
    description: 'La postulación no existe o el identificador no es válido',
  })
  @ApiConflictResponse({
    description: 'La postulación no puede reactivarse o la vacante no está disponible',
  })
  reactivateApplication(
    @Param('id', applicationIdPipe) id: string,
    @CurrentUserId() userId: string,
  ) {
    return this.applicationsService.reactivateApplication(id, userId);
  }

  @Get(':id/contact')
  @ApiOperation({
    summary: 'Consulta los contactos de reclutadores de una postulación',
    operationId: 'getApplicationContact',
  })
  @ApiParam({ name: 'id', description: 'UUID de la postulación', type: String })
  @ApiOkResponse({
    description: 'Datos de la vacante, empresa y reclutadores activos',
    schema: {
      type: 'object',
      required: [
        'applicationId',
        'jobOfferId',
        'vacancyTitle',
        'companyId',
        'companyName',
        'recruiters',
      ],
      properties: {
        applicationId: { type: 'string' },
        jobOfferId: { type: 'string' },
        vacancyTitle: { type: 'string' },
        companyId: { type: 'string' },
        companyName: { type: 'string' },
        recruiters: {
          type: 'array',
          description: 'Contactos de reclutadores activos de la empresa',
          items: {
            type: 'object',
            required: ['id', 'fullName'],
            properties: {
              id: { type: 'string' },
              fullName: { type: 'string' },
            },
          },
        },
      },
    },
  })
  @ApiForbiddenResponse({
    description: 'El estado de la postulación no permite consultar contactos',
  })
  @ApiNotFoundResponse({
    description: 'La postulación no existe, no pertenece al usuario o el ID no es válido',
  })
  getApplicationContact(
    @Param('id', applicationIdPipe) id: string,
    @CurrentUserId() userId: string,
  ) {
    return this.applicationsService.getApplicationContact(id, userId);
  }

  @Patch(':id/withdraw')
  @HttpCode(HttpStatus.NO_CONTENT)
  withdrawApplication(
    @Param('id', applicationIdPipe) id: string,
    @CurrentUserId() userId: string,
  ) {
    return this.applicationsService.withdrawApplication(id, userId);
  }
}
