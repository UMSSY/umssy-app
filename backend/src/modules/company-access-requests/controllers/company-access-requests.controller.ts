import {
  applyDecorators,
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import type { UploadedDocumentFile } from '../../access-requests/types/uploaded-file.types.js';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiConsumes,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiProduces,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator.js';
import { Roles } from '../../../common/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../../common/guards/roles.guard.js';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe.js';
import type { AuthenticatedUser } from '../../../common/types/authenticated-user.types.js';
import { BACKOFFICE_ROLE } from '../../access-requests/constants/backoffice.constants.js';
import { DocumentUploadInterceptor } from '../../access-requests/interceptors/document-upload.interceptor.js';
import {
  ACTIVATE_COMPANY_ACCOUNT_BODY,
  BINARY_FILE_OK_RESPONSE,
  CITIES_OK_RESPONSE,
  COMPANY_DETAIL_OK_RESPONSE,
  COMPANY_ID_PARAM,
  COMPANY_LIST_OK_RESPONSE,
  COMPANY_REQUEST_CODE_PARAM,
  COMPANY_REQUEST_ID_PARAM,
  COMPANY_SUMMARY_OK_RESPONSE,
  CREATE_COMPANY_REQUEST_BODY,
  REJECT_COMPANY_REQUEST_BODY,
  REPORT_INCONSISTENCY_BODY,
  REQUEST_CORRECTION_BODY,
  UPDATE_COMPANY_REQUEST_BODY,
  UPLOAD_DOCUMENT_MULTIPART_BODY,
  UPLOAD_LOGO_MULTIPART_BODY,
} from '../constants/company-access-requests-openapi.constants.js';
import {
  activateCompanyAccountSchema,
  createCompanyAccessRequestSchema,
  listCompanyAccessRequestsQuerySchema,
  rejectCompanyAccessRequestSchema,
  reportInconsistencySchema,
  requestCorrectionSchema,
  updateCompanyAccessRequestSchema,
  type ActivateCompanyAccountDto,
  type CreateCompanyAccessRequestDto,
  type ListCompanyAccessRequestsQuery,
  type RejectCompanyAccessRequestDto,
  type ReportInconsistencyDto,
  type RequestCorrectionDto,
  type UpdateCompanyAccessRequestDto,
} from '../requests/create-company-access-request.schema.js';
import { CompanyAccessRequestsService } from '../services/company-access-requests.service.js';

interface BinaryResponse {
  set: (headers: Record<string, string>) => unknown;
  end: (body: Buffer) => unknown;
}

const ApiBackofficeAccess = () =>
  applyDecorators(
    UseGuards(JwtAuthGuard, RolesGuard),
    Roles(BACKOFFICE_ROLE),
    ApiBearerAuth(),
    ApiUnauthorizedResponse({
      description: 'Sesión no autenticada o credencial expirada.',
    }),
    ApiForbiddenResponse({
      description: 'El usuario no cuenta con el rol administrativo.',
    }),
  );

const ApiCompanyRequestUuidParam = () =>
  applyDecorators(
    ApiParam(COMPANY_REQUEST_ID_PARAM),
    ApiBadRequestResponse({
      description: 'El identificador de la solicitud no tiene formato UUID válido.',
    }),
  );

@ApiTags('Solicitudes de acceso empresarial')
@Controller()
export class CompanyAccessRequestsController {
  constructor(
    private readonly companyRequestsService: CompanyAccessRequestsService,
  ) {}

  @Get('cities')
  @ApiOperation({
    operationId: 'companyAccessRequests_listCities',
    summary: 'Listar ciudades disponibles',
    description:
      'Obtiene el catálogo alfabético de ciudades habilitadas para el formulario de registro empresarial.',
  })
  @ApiOkResponse(CITIES_OK_RESPONSE)
  listCities() {
    return this.companyRequestsService.listCities();
  }

  @Post('company-access-requests')
  @ApiOperation({
    operationId: 'companyAccessRequests_create',
    summary: 'Crear borrador de solicitud de acceso empresarial',
    description:
      'Registra un borrador inicial de solicitud empresarial validando duplicados de empresa, usuario y solicitudes activas.',
  })
  @ApiBody(CREATE_COMPANY_REQUEST_BODY)
  @ApiCreatedResponse({
    description: 'Borrador creado correctamente.',
    schema: { type: 'object', properties: { id: { type: 'string', format: 'uuid' } } },
  })
  @ApiBadRequestResponse({ description: 'Datos de entrada inválidos.' })
  @ApiConflictResponse({
    description:
      'Conflicto de registro (COMPANY_REGISTRATION_CONFLICT). `data.field` indica el motivo: `companyName` (empresa ya registrada), `email` (correo ya usado), `activeRequest` (solicitud pendiente, en revisión, observada o aprobada con el mismo nombre o correo) o `username` (nombre de usuario no disponible, sin distinguir mayúsculas ni espacios sobrantes).',
  })
  create(
    @Body(new ZodValidationPipe(createCompanyAccessRequestSchema))
    body: CreateCompanyAccessRequestDto,
  ) {
    return this.companyRequestsService.create(body);
  }

  @Post('company-access-requests/:id/logo')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 2 * 1024 * 1024 } }),
  )
  @ApiOperation({
    operationId: 'companyAccessRequests_attachLogo',
    summary: 'Adjuntar logotipo al borrador de empresa',
    description:
      'Sube un logotipo empresarial en formato PNG, JPG, WEBP o SVG con límite máximo de 2 MB para un borrador existente.',
  })
  @ApiCompanyRequestUuidParam()
  @ApiConsumes('multipart/form-data')
  @ApiBody(UPLOAD_LOGO_MULTIPART_BODY)
  @ApiCreatedResponse({
    description: 'Logotipo adjuntado al borrador.',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        logoFileId: { type: 'string', format: 'uuid' },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Solicitud no encontrada.' })
  attachLogo(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: UploadedDocumentFile | undefined,
  ) {
    return this.companyRequestsService.attachLogo(id, file);
  }

  @Post('company-access-requests/:id/document')
  @UseInterceptors(
    DocumentUploadInterceptor,
    FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }),
  )
  @ApiOperation({
    operationId: 'companyAccessRequests_attachDocument',
    summary: 'Adjuntar carta de solicitud en hoja membretada',
    description:
      'Sube el documento oficial de solicitud en formato PDF o imagen admitida con un tamaño máximo de 10 MB.',
  })
  @ApiCompanyRequestUuidParam()
  @ApiConsumes('multipart/form-data')
  @ApiBody(UPLOAD_DOCUMENT_MULTIPART_BODY)
  @ApiCreatedResponse({
    description: 'Carta de solicitud adjuntada correctamente.',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        documentFileId: { type: 'string', format: 'uuid' },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Solicitud no encontrada.' })
  attachDocument(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: UploadedDocumentFile | undefined,
  ) {
    return this.companyRequestsService.attachDocument(id, file);
  }

  @Post('company-access-requests/:id/submit')
  @ApiOperation({
    operationId: 'companyAccessRequests_submit',
    summary: 'Enviar solicitud de empresa a revisión',
    description:
      'Valida la existencia del documento adjunto, genera el código de seguimiento EMP-YYYY-NNNN y pasa la solicitud a estado PENDING.',
  })
  @ApiCompanyRequestUuidParam()
  @ApiCreatedResponse({
    description: 'Solicitud enviada formalmente.',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        requestCode: { type: 'string', example: 'EMP-2026-0001' },
        status: { type: 'string', example: 'PENDING' },
        submittedAt: { type: 'string', format: 'date-time', nullable: true },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Solicitud no encontrada.' })
  submit(@Param('id', ParseUUIDPipe) id: string) {
    return this.companyRequestsService.submit(id);
  }

  @Get('company-access-requests/status/:code')
  @ApiOperation({
    operationId: 'companyAccessRequests_getPublicStatus',
    summary: 'Consultar estado público de solicitud empresarial',
    description:
      'Permite al postulante consultar el estado actual y motivo de rechazo de una solicitud mediante su código y correo.',
  })
  @ApiParam(COMPANY_REQUEST_CODE_PARAM)
  @ApiQuery({
    name: 'email',
    required: true,
    description: 'Correo institucional registrado en la solicitud.',
    schema: { type: 'string', format: 'email' },
  })
  @ApiOkResponse({
    description: 'Estado actual de la solicitud consultada.',
    schema: {
      type: 'object',
      properties: {
        requestCode: { type: 'string', nullable: true, example: 'EMP-2026-0001' },
        companyName: { type: 'string' },
        status: { type: 'string', example: 'PENDING' },
        submittedAt: { type: 'string', format: 'date-time', nullable: true },
        reviewedAt: { type: 'string', format: 'date-time', nullable: true },
        rejectionReason: { type: 'string', nullable: true },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'No se encontró ninguna solicitud con ese código y correo.',
  })
  getStatus(@Param('code') code: string, @Query('email') email: string) {
    return this.companyRequestsService.getStatus(code, email ?? '');
  }

  @Get('company-access-requests/activation-status')
  @ApiOperation({
    operationId: 'companyAccessRequests_getActivationStatus',
    summary: 'Consultar estado de activación de cuenta empresarial',
    description:
      'Verifica si el enlace de activación y código de seguimiento permiten continuar con la configuración de credenciales.',
  })
  @ApiQuery({ name: 'email', required: true, schema: { type: 'string', format: 'email' } })
  @ApiQuery({ name: 'code', required: false, schema: { type: 'string' } })
  @ApiQuery({ name: 'otp', required: false, schema: { type: 'string' } })
  @ApiOkResponse({
    description: 'Estado del flujo de activación (INVALID, NOT_FOUND, PENDING, READY, etc.).',
    schema: {
      type: 'object',
      properties: {
        state: { type: 'string', example: 'READY' },
        email: { type: 'string', format: 'email' },
        message: { type: 'string' },
        data: { type: 'object', nullable: true },
      },
    },
  })
  getActivationStatus(
    @Query('email') email?: string,
    @Query('code') code?: string,
    @Query('otp') otp?: string,
  ) {
    return this.companyRequestsService.getActivationStatus(
      email ?? '',
      code,
      otp,
    );
  }

  @Post('company-access-requests/report-inconsistency')
  @ApiOperation({
    operationId: 'companyAccessRequests_reportInconsistency',
    summary: 'Reportar inconsistencia en datos de solicitud',
    description:
      'Registra una observación enviada por la empresa postulante para revisión administrativa.',
  })
  @ApiBody(REPORT_INCONSISTENCY_BODY)
  @ApiCreatedResponse({
    description: 'Reporte de inconsistencia registrado.',
    schema: {
      type: 'object',
      properties: {
        reported: { type: 'boolean', example: true },
        message: { type: 'string' },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Cuerpo de solicitud inválido.' })
  @ApiNotFoundResponse({ description: 'Solicitud no encontrada.' })
  reportInconsistency(
    @Body(new ZodValidationPipe(reportInconsistencySchema))
    body: ReportInconsistencyDto,
  ) {
    return this.companyRequestsService.reportInconsistency(body);
  }

  @Post('company-access-requests/activate')
  @ApiOperation({
    operationId: 'companyAccessRequests_activate',
    summary: 'Activar cuenta de empresa con código OTP',
    description:
      'Valida el código de activación vigente enviado tras la aprobación y define la contraseña de acceso institucional.',
  })
  @ApiBody(ACTIVATE_COMPANY_ACCOUNT_BODY)
  @ApiCreatedResponse({
    description: 'Cuenta empresarial activada correctamente.',
    schema: {
      type: 'object',
      properties: {
        requestId: { type: 'string', format: 'uuid' },
        activated: { type: 'boolean', example: true },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'OTP incorrecto, expirado o solicitud no elegible para activación.',
  })
  activate(
    @Body(new ZodValidationPipe(activateCompanyAccountSchema))
    body: ActivateCompanyAccountDto,
  ) {
    return this.companyRequestsService.activate(body);
  }

  @Get('companies/:companyId/logo')
  @ApiOperation({
    operationId: 'companyAccessRequests_getPublicCompanyLogo',
    summary: 'Obtener logotipo público de empresa aprobada',
    description:
      'Devuelve la imagen binaria del logotipo almacenado para una empresa ya aprobada en el sistema.',
  })
  @ApiParam(COMPANY_ID_PARAM)
  @ApiProduces('image/png', 'image/jpeg', 'image/webp', 'image/svg+xml')
  @ApiOkResponse(BINARY_FILE_OK_RESPONSE)
  @ApiBadRequestResponse({ description: 'El identificador de empresa no es un UUID válido.' })
  @ApiNotFoundResponse({ description: 'Logo de empresa no encontrado.' })
  async getPublicLogo(
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @Res() res: BinaryResponse,
  ) {
    const file =
      await this.companyRequestsService.getPublicCompanyLogo(companyId);
    res.set({
      'Content-Type': file.mimeType,
      'Content-Length': String(file.content.length),
      'Cache-Control': 'public, max-age=3600',
    });
    res.end(file.content);
  }

  @Get('company-access-requests')
  @ApiBackofficeAccess()
  @ApiOperation({
    operationId: 'companyAccessRequests_list',
    summary: 'Listar solicitudes de acceso empresarial',
    description:
      'Obtiene la bandeja paginada de solicitudes enviadas con filtros por estado y texto libre. Solo disponible para el rol administrativo.',
  })
  @ApiQuery({ name: 'page', required: false, schema: { type: 'integer', minimum: 1, default: 1 } })
  @ApiQuery({
    name: 'limit',
    required: false,
    schema: { type: 'integer', minimum: 1, maximum: 50, default: 10 },
  })
  @ApiQuery({
    name: 'status',
    required: false,
    schema: {
      type: 'string',
      enum: ['PENDING', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'ALL'],
      default: 'ALL',
    },
  })
  @ApiQuery({ name: 'search', required: false, schema: { type: 'string' } })
  @ApiOkResponse(COMPANY_LIST_OK_RESPONSE)
  @ApiBadRequestResponse({ description: 'Parámetros de consulta inválidos.' })
  list(
    @Query(new ZodValidationPipe(listCompanyAccessRequestsQuerySchema))
    query: ListCompanyAccessRequestsQuery,
  ) {
    return this.companyRequestsService.list(query);
  }

  @Get('company-access-requests/summary')
  @ApiBackofficeAccess()
  @ApiOperation({
    operationId: 'companyAccessRequests_getSummary',
    summary: 'Obtener resumen numérico de solicitudes empresariales',
    description:
      'Retorna los totales por estado para las tarjetas KPI de administración. Solo disponible para el rol administrativo.',
  })
  @ApiOkResponse(COMPANY_SUMMARY_OK_RESPONSE)
  getSummary() {
    return this.companyRequestsService.getSummary();
  }

  @Get('company-access-requests/:id')
  @ApiBackofficeAccess()
  @ApiOperation({
    operationId: 'companyAccessRequests_getDetail',
    summary: 'Obtener expediente de solicitud empresarial',
    description:
      'Devuelve el detalle del expediente, marca la solicitud como en revisión si estaba pendiente y ejecuta OCR si aún no tiene resultados. Solo disponible para el rol administrativo.',
  })
  @ApiCompanyRequestUuidParam()
  @ApiOkResponse(COMPANY_DETAIL_OK_RESPONSE)
  @ApiNotFoundResponse({ description: 'Solicitud de empresa no encontrada.' })
  getDetail(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.companyRequestsService.getDetail(id, user.id);
  }

  @Get('company-access-requests/:id/document')
  @ApiBackofficeAccess()
  @ApiOperation({
    operationId: 'companyAccessRequests_getDocument',
    summary: 'Descargar carta de solicitud empresarial',
    description:
      'Entrega el documento binario adjunto en la solicitud para su revisión en el expediente administrativo.',
  })
  @ApiCompanyRequestUuidParam()
  @ApiProduces('application/pdf', 'image/*')
  @ApiOkResponse(BINARY_FILE_OK_RESPONSE)
  @ApiNotFoundResponse({ description: 'Documento de solicitud no encontrado.' })
  async getDocument(
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: BinaryResponse,
  ) {
    const file = await this.companyRequestsService.getDocument(id);
    res.set({
      'Content-Type': file.mimeType,
      'Content-Length': String(file.content.length),
      'Content-Disposition': `inline; filename*=UTF-8''${encodeURIComponent(file.name)}`,
    });
    res.end(file.content);
  }

  @Get('company-access-requests/:id/logo')
  @ApiBackofficeAccess()
  @ApiOperation({
    operationId: 'companyAccessRequests_getRequestLogo',
    summary: 'Obtener logotipo adjunto de solicitud empresarial',
    description:
      'Devuelve el archivo de imagen del logotipo vinculado a la solicitud o a la empresa aprobada. Solo disponible para el rol administrativo.',
  })
  @ApiCompanyRequestUuidParam()
  @ApiProduces('image/png', 'image/jpeg', 'image/webp', 'image/svg+xml')
  @ApiOkResponse(BINARY_FILE_OK_RESPONSE)
  @ApiNotFoundResponse({
    description: 'La solicitud no existe o la empresa no adjuntó un logotipo.',
  })
  async getRequestLogo(
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: BinaryResponse,
  ) {
    const file = await this.companyRequestsService.getLogo(id);
    res.set({
      'Content-Type': file.mimeType,
      'Content-Length': String(file.content.length),
    });
    res.end(file.content);
  }

  @Patch('company-access-requests/:id')
  @ApiBackofficeAccess()
  @ApiOperation({
    operationId: 'companyAccessRequests_update',
    summary: 'Editar datos de solicitud empresarial en revisión',
    description:
      'Actualiza campos corregidos desde administración mientras la solicitud no haya sido aprobada y reevalúa el contraste OCR.',
  })
  @ApiCompanyRequestUuidParam()
  @ApiBody(UPDATE_COMPANY_REQUEST_BODY)
  @ApiOkResponse(COMPANY_DETAIL_OK_RESPONSE)
  @ApiNotFoundResponse({ description: 'Solicitud de empresa no encontrada.' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(updateCompanyAccessRequestSchema))
    body: UpdateCompanyAccessRequestDto,
  ) {
    return this.companyRequestsService.update(id, body);
  }

  @Post('company-access-requests/:id/re-evaluate-ocr')
  @ApiBackofficeAccess()
  @ApiOperation({
    operationId: 'companyAccessRequests_reEvaluateOcr',
    summary: 'Reevaluar análisis OCR del expediente',
    description:
      'Ejecuta nuevamente la verificación OCR entre el documento adjunto y los campos actuales de la solicitud.',
  })
  @ApiCompanyRequestUuidParam()
  @ApiCreatedResponse({
    description: 'Resultado actualizado del contraste OCR.',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        ocrMatchScore: { type: 'number', example: 85 },
        ocrFieldResults: { type: 'object', nullable: true },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Solicitud de empresa no encontrada.' })
  reEvaluateOcr(@Param('id', ParseUUIDPipe) id: string) {
    return this.companyRequestsService.reEvaluateOcr(id);
  }

  @Post('company-access-requests/:id/request-correction')
  @ApiBackofficeAccess()
  @ApiOperation({
    operationId: 'companyAccessRequests_requestCorrection',
    summary: 'Solicitar subsanación de solicitud empresarial',
    description:
      'Cambia el estado de la solicitud a OBSERVED y envía la notificación de subsanación vía NotificationsService.',
  })
  @ApiCompanyRequestUuidParam()
  @ApiBody(REQUEST_CORRECTION_BODY)
  @ApiCreatedResponse(COMPANY_DETAIL_OK_RESPONSE)
  @ApiNotFoundResponse({ description: 'Solicitud de empresa no encontrada.' })
  requestCorrection(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(requestCorrectionSchema))
    body: RequestCorrectionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.companyRequestsService.requestCorrection(id, user.id, body);
  }

  @Patch('company-access-requests/:id/approve')
  @ApiBackofficeAccess()
  @ApiOperation({
    operationId: 'companyAccessRequests_approve',
    summary: 'Aprobar solicitud empresarial y emitir OTP de activación',
    description:
      'Aprueba la solicitud, crea los registros base de empresa y usuario, y dispara la notificación de activación vía NotificationsService.',
  })
  @ApiCompanyRequestUuidParam()
  @ApiOkResponse({
    description:
      'Solicitud aprobada y código de activación emitido. La aprobación queda guardada aunque el correo falle: activationCodeSent indica si el correo con el código se envió.',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        status: { type: 'string', example: 'APPROVED' },
        approvedCompanyId: { type: 'string', format: 'uuid', nullable: true },
        activationCodeSent: {
          type: 'boolean',
          example: true,
          description:
            'true si el correo con el código de activación se envió; false si el envío falló o se omitió.',
        },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Solicitud de empresa no encontrada.' })
  approve(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.companyRequestsService.approve(id, user.id);
  }

  @Patch('company-access-requests/:id/reject')
  @ApiBackofficeAccess()
  @ApiOperation({
    operationId: 'companyAccessRequests_reject',
    summary: 'Rechazar solicitud de acceso empresarial',
    description:
      'Registra el dictamen de rechazo administrativo y envía la notificación correspondiente vía NotificationsService.',
  })
  @ApiCompanyRequestUuidParam()
  @ApiBody(REJECT_COMPANY_REQUEST_BODY)
  @ApiOkResponse({
    description: 'Solicitud rechazada.',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        status: { type: 'string', example: 'REJECTED' },
        rejectionReason: { type: 'string' },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Solicitud de empresa no encontrada.' })
  reject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(rejectCompanyAccessRequestSchema))
    body: RejectCompanyAccessRequestDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.companyRequestsService.reject(id, user.id, body);
  }
}
