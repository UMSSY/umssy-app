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
    schema: {
      type: 'object',
      required: ['statusCode', 'code', 'data', 'detail', 'ok'],
      properties: {
        statusCode: { type: 'integer', example: 403 },
        code: { type: 'string', example: 'APPLICATION_FORBIDDEN' },
        data: { type: 'object', nullable: true, example: null },
        detail: {
          type: 'string',
          example: 'No tienes permisos para retirar esta postulación',
        },
        ok: { type: 'boolean', example: false },
      },
      example: {
        statusCode: 403,
        code: 'APPLICATION_FORBIDDEN',
        data: null,
        detail: 'No tienes permisos para retirar esta postulación',
        ok: false,
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'La postulación no existe o el identificador no es válido',
    schema: {
      type: 'object',
      required: ['statusCode', 'code', 'data', 'detail', 'ok'],
      properties: {
        statusCode: { type: 'integer', example: 404 },
        code: { type: 'string', example: 'APPLICATION_NOT_FOUND' },
        data: { type: 'object', nullable: true, example: null },
        detail: { type: 'string', example: 'La postulación no existe' },
        ok: { type: 'boolean', example: false },
      },
      example: {
        statusCode: 404,
        code: 'APPLICATION_NOT_FOUND',
        data: null,
        detail: 'La postulación no existe',
        ok: false,
      },
    },
  })
  @ApiConflictResponse({
    description: 'La postulación no puede reactivarse o la vacante no está disponible',
    schema: {
      type: 'object',
      required: ['statusCode', 'code', 'data', 'detail', 'ok'],
      properties: {
        statusCode: { type: 'integer', example: 409 },
        code: { type: 'string', example: 'APPLICATION_NOT_REACTIVABLE' },
        data: { type: 'object', nullable: true, example: null },
        detail: {
          type: 'string',
          example: 'La postulación no puede reactivarse en su estado actual o la vacante ya no está disponible.',
        },
        ok: { type: 'boolean', example: false },
      },
      example: {
        statusCode: 409,
        code: 'APPLICATION_NOT_REACTIVABLE',
        data: null,
        detail: 'La postulación no puede reactivarse en su estado actual o la vacante ya no está disponible.',
        ok: false,
      },
    },
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
    description: 'Datos de vacante, empresa y reclutadores activos, en el envoltorio global',
    schema: {
      type: 'object',
      required: ['statusCode', 'ok', 'detail', 'data'],
      properties: {
        statusCode: { type: 'integer', example: 200 },
        ok: { type: 'boolean', example: true },
        detail: { type: 'string', example: 'Operación exitosa' },
        data: {
          type: 'object',
          required: [
            'applicationId', 'jobOfferId', 'vacancyTitle',
            'companyId', 'companyName', 'recruiters',
          ],
          properties: {
            applicationId: { type: 'string', format: 'uuid' },
            jobOfferId: { type: 'string', format: 'uuid' },
            vacancyTitle: { type: 'string' },
            companyId: { type: 'string', format: 'uuid' },
            companyName: { type: 'string' },
            recruiters: {
              type: 'array',
              description: 'Reclutadores activos de la empresa',
              items: {
                type: 'object',
                required: ['id', 'fullName'],
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  fullName: { type: 'string' },
                },
              },
            },
          },
        },
      },
      example: {
        statusCode: 200,
        ok: true,
        detail: 'Operación exitosa',
        data: {
          applicationId: 'c7517198-ec2b-4c4f-89d8-c3cfe269b3b1',
          jobOfferId: '3a183b0f-6798-4505-9eaa-7c4ece3119e1',
          vacancyTitle: 'Desarrollador Backend',
          companyId: '24e84ac3-8b47-4d18-8793-a8be6b65a5c1',
          companyName: 'Empresa de ejemplo',
          recruiters: [{ id: '37bc41b2-9aad-485c-b88e-d5ed7d19f48e', fullName: 'Ana Pérez' }],
        },
      },
    },
  })
  @ApiForbiddenResponse({
    description: 'El estado de la postulación no permite consultar contactos',
    schema: {
      type: 'object',
      required: ['statusCode', 'code', 'data', 'detail', 'ok'],
      properties: {
        statusCode: { type: 'integer', example: 403 },
        code: { type: 'string', example: 'APPLICATION_CONTACT_RESTRICTED' },
        data: { type: 'object', nullable: true, example: null },
        detail: { type: 'string', example: 'Esta postulación ya no permite la comunicación directa con el reclutador' },
        ok: { type: 'boolean', example: false },
      },
      example: {
        statusCode: 403,
        code: 'APPLICATION_CONTACT_RESTRICTED',
        data: null,
        detail: 'Esta postulación ya no permite la comunicación directa con el reclutador',
        ok: false,
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'La postulación no existe, no pertenece al usuario o el ID no es válido',
    schema: {
      type: 'object',
      required: ['statusCode', 'code', 'data', 'detail', 'ok'],
      properties: {
        statusCode: { type: 'integer', example: 404 },
        code: { type: 'string', example: 'APPLICATION_NOT_FOUND' },
        data: { type: 'object', nullable: true, example: null },
        detail: { type: 'string', example: 'La postulación no existe' },
        ok: { type: 'boolean', example: false },
      },
      example: {
        statusCode: 404,
        code: 'APPLICATION_NOT_FOUND',
        data: null,
        detail: 'La postulación no existe',
        ok: false,
      },
    },
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
