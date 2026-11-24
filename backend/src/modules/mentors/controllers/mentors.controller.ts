import { mentorApiOperation } from '../decorators/mentor-api-operation.decorator.js';
import { MENTOR_API_SCHEMAS } from '../responses/mentor-openapi.response.js';
import {
  ApiTags,
  ApiBody,
  ApiHeader,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { toApiBody } from '../../../common/utils/to-api-body.js';
import {
  Body,
  Controller,
  Get,
  Headers,
  Patch,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { CurrentUser } from '../../../common/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { ResponseInterceptor } from '../../../common/interceptors/index.js';
import { ZodValidationPipe } from 'nestjs-zod';
import { RequestValidationPipe } from '../../../common/pipes/request-validation.pipe.js';
import type { AuthenticatedUser } from '../../../common/types/authenticated-user.types.js';
import {
  activateMentorSchema,
  type ActivateMentorDto,
} from '../requests/activate-mentor.schema.js';
import {
  updateMentorTechnicalAreasSchema,
  type UpdateMentorTechnicalAreasDto,
} from '../requests/update-mentor-technical-areas.schema.js';
import {
  updateMentorOrientationTypesSchema,
  type UpdateMentorOrientationTypesDto,
} from '../requests/update-mentor-orientation-types.schema.js';
import { MentorsService } from '../services/mentors.service.js';
import { requireMentorIdempotencyKey } from '../requests/mentor-idempotency-key.schema.js';
import {
  mentorDirectoryQuerySchema,
  type MentorDirectoryQuery,
} from '../requests/mentor-directory-query.schema.js';

@ApiTags('mentors')
@Controller('mentors')
@UseInterceptors(ResponseInterceptor)
export class MentorsController {
  constructor(private readonly mentorsService: MentorsService) {}

  @mentorApiOperation({
    operationId: 'listMentors',
    summary: 'Listar mentores',
    description:
      'Público. Usuarios activos con rol mentor vigente; nombres, apellidos e ID ascendentes.',
    data: MENTOR_API_SCHEMAS.list,
    example: [],
    auth: false,
    errors: [],
    status: 200,
  })
  @Get()
  findAll() {
    return this.mentorsService.findAll();
  }

  @mentorApiOperation({
    operationId: 'getMentorDirectory',
    summary: 'Consultar directorio',
    description:
      'Sesión activa con cualquier rol válido. Páginas de seis; afinidad puede volver a default con affinityStatus no_skills o unmapped_skills. Página ajustada al rango disponible.',
    data: MENTOR_API_SCHEMAS.directory,
    example: {
      items: [],
      page: 1,
      pageSize: 6,
      totalItems: 0,
      totalPages: 0,
      effectiveSort: 'default',
    },
    auth: true,
    errors: [400],
    status: 200,
  })
  @ApiQuery({
    name: 'page',
    required: false,
    schema: {
      type: 'integer',
      minimum: 1,
      maximum: 9007199254740991,
      default: 1,
    },
  })
  @ApiQuery({
    name: 'search',
    required: false,
    schema: { type: 'string', maxLength: 100, default: '' },
  })
  @ApiQuery({
    name: 'area',
    required: false,
    schema: { type: 'string', minLength: 1, maxLength: 80 },
  })
  @ApiQuery({
    name: 'orientation',
    required: false,
    schema: { type: 'string', minLength: 1, maxLength: 80 },
  })
  @ApiQuery({
    name: 'available',
    required: false,
    schema: { type: 'string', enum: ['true', 'false'], default: 'false' },
  })
  @ApiQuery({
    name: 'sort',
    required: false,
    schema: {
      type: 'string',
      enum: ['default', 'name_asc', 'name_desc', 'affinity'],
      default: 'default',
    },
  })
  @Get('directory')
  @UseGuards(JwtAuthGuard)
  findDirectory(
    @Query(new RequestValidationPipe(mentorDirectoryQuerySchema))
    query: MentorDirectoryQuery,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.mentorsService.findDirectory(query, user.id);
  }

  @mentorApiOperation({
    operationId: 'getMyMentorTechnicalAreas',
    summary: 'Consultar áreas guardadas',
    description:
      'Sesión y participación activa (404 sin mentor activo). Selecciones por nombre.',
    data: MENTOR_API_SCHEMAS.selections,
    example: [],
    auth: true,
    errors: [404],
    status: 200,
  })
  @Get('me/technical-areas')
  @UseGuards(JwtAuthGuard)
  findMyTechnicalAreas(@CurrentUser() user: AuthenticatedUser) {
    return this.mentorsService.findMyTechnicalAreas(user.id);
  }

  @mentorApiOperation({
    operationId: 'getMentorProfileSuggestions',
    summary: 'Consultar sugerencias',
    description:
      'Sesión activa con cualquier rol válido; identidad de CurrentUser. Orden: foto, descripción, especialidad, experiencia. Sin participación activa devuelve lista vacía válida; fallo de consulta es 500 INTERNAL_ERROR. Disponibilidad no equivale a pausa.',
    data: MENTOR_API_SCHEMAS.suggestions,
    example: { suggestions: [], pendingCount: 0 },
    auth: true,
    errors: [],
    status: 200,
  })
  @Get('me/profile-suggestions')
  @UseGuards(JwtAuthGuard)
  findMyProfileSuggestions(@CurrentUser() user: AuthenticatedUser) {
    return this.mentorsService.findMyProfileSuggestions(user.id);
  }

  @mentorApiOperation({
    operationId: 'getMyMentorParticipation',
    summary: 'Consultar participación',
    description:
      'Sesión activa con cualquier rol válido. Estado ACTIVE, DEACTIVATED o NEVER según roles mentor y selecciones guardadas.',
    data: MENTOR_API_SCHEMAS.participation,
    example: { status: 'NEVER', areas: [], orientations: [] },
    auth: true,
    errors: [],
    status: 200,
  })
  @Get('me/participation')
  @UseGuards(JwtAuthGuard)
  findMyParticipation(@CurrentUser() user: AuthenticatedUser) {
    return this.mentorsService.findMyParticipation(user.id);
  }

  @mentorApiOperation({
    operationId: 'updateMyMentorTechnicalAreas',
    summary: 'Guardar áreas técnicas',
    description:
      'Sesión y participación activa; reemplaza selecciones válidas. UUIDs únicos, al menos uno. 404 sin mentor activo; 400 selección inválida.',
    data: MENTOR_API_SCHEMAS.technicalUpdate,
    example: { technicalAreaIds: ['7dd01892-ef53-456b-8e5c-fde35324dc18'] },
    auth: true,
    errors: [400, 404],
    status: 200,
  })
  @ApiBody(toApiBody(updateMentorTechnicalAreasSchema))
  @Patch('me/technical-areas')
  @UseGuards(JwtAuthGuard)
  updateMyTechnicalAreas(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(updateMentorTechnicalAreasSchema))
    body: UpdateMentorTechnicalAreasDto,
  ) {
    return this.mentorsService.updateMyTechnicalAreas(user.id, body);
  }

  @mentorApiOperation({
    operationId: 'getMyMentorOrientationTypes',
    summary: 'Consultar orientaciones',
    description:
      'Sesión y participación activa; solo orientaciones activas, por nombre. 404 sin mentor activo.',
    data: MENTOR_API_SCHEMAS.selections,
    example: [],
    auth: true,
    errors: [404],
    status: 200,
  })
  @Get('me/orientation-types')
  @UseGuards(JwtAuthGuard)
  findMyOrientationTypes(@CurrentUser() user: AuthenticatedUser) {
    return this.mentorsService.findMyOrientationTypes(user.id);
  }

  @mentorApiOperation({
    operationId: 'updateMyMentorOrientationTypes',
    summary: 'Guardar orientaciones',
    description:
      'Sesión y participación activa; reemplaza selecciones activas. UUIDs únicos, al menos uno. 404 sin mentor activo; 400 selección inválida.',
    data: MENTOR_API_SCHEMAS.orientationUpdate,
    example: { orientationTypeIds: ['7dd01892-ef53-456b-8e5c-fde35324dc18'] },
    auth: true,
    errors: [400, 404],
    status: 200,
  })
  @ApiBody(toApiBody(updateMentorOrientationTypesSchema))
  @Patch('me/orientation-types')
  @UseGuards(JwtAuthGuard)
  updateMyOrientationTypes(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(updateMentorOrientationTypesSchema))
    body: UpdateMentorOrientationTypesDto,
  ) {
    return this.mentorsService.updateMyOrientationTypes(user.id, body);
  }

  @mentorApiOperation({
    operationId: 'getMentorCapacity',
    summary: 'Consultar disponibilidad',
    description:
      'Sesión activa con cualquier rol válido. Consulta capacidad sin asignar ni reconciliar ofertas.',
    data: MENTOR_API_SCHEMAS.capacity,
    example: {
      percentage: 40,
      approvedGraduates: 10,
      activeMentors: 2,
      reservedOffers: 1,
      capacity: 4,
      occupied: 3,
      available: 1,
    },
    auth: true,
    errors: [],
    status: 200,
  })
  @Get('capacity')
  @UseGuards(JwtAuthGuard)
  capacity() {
    return this.mentorsService.capacity();
  }

  @mentorApiOperation({
    operationId: 'getMentorProfile',
    summary: 'Consultar perfil público',
    description: 'Público. 404 MENTOR_NOT_FOUND si no existe o no está activo.',
    data: MENTOR_API_SCHEMAS.profile,
    example: {
      id: '7dd01892-ef53-456b-8e5c-fde35324dc18',
      fullName: 'Ana Pérez',
      headline: null,
      aboutMe: null,
      isAvailable: true,
      photoUrl: null,
      city: null,
      educations: [],
      workExperiences: [],
      skills: [],
      certifications: [],
      technicalAreas: [],
      orientationTypes: [],
    },
    auth: false,
    errors: [400, 404],
    status: 200,
  })
  @ApiParam({
    name: 'userId',
    description: 'UUID v4.',
    schema: {
      type: 'string',
      format: 'uuid',
      example: '7dd01892-ef53-456b-8e5c-fde35324dc18',
    },
  })
  @Get(':userId')
  findOne(
    @Param('userId', new ParseUUIDPipe({ version: '4' })) userId: string,
  ) {
    return this.mentorsService.findOne(userId);
  }

  @mentorApiOperation({
    operationId: 'getSimilarMentors',
    summary: 'Consultar mentores similares',
    description:
      'Público. Hasta tres candidatos; áreas compartidas DESC, orientaciones DESC e ID ASC. Excluye origen. Sin coincidencias devuelve []; origen ausente produce 404.',
    data: MENTOR_API_SCHEMAS.similar,
    example: [],
    auth: false,
    errors: [400, 404],
    status: 200,
  })
  @ApiParam({
    name: 'userId',
    description: 'UUID v4.',
    schema: {
      type: 'string',
      format: 'uuid',
      example: '7dd01892-ef53-456b-8e5c-fde35324dc18',
    },
  })
  @Get(':userId/similar')
  findSimilar(
    @Param('userId', new ParseUUIDPipe({ version: '4' })) userId: string,
  ) {
    return this.mentorsService.findSimilar(userId);
  }

  @mentorApiOperation({
    operationId: 'activateMentor',
    summary: 'Activar participación',
    description:
      'Titulado aprobado y vinculado. Valida selecciones y cupos bajo lock. 409: ALREADY_MENTOR, NO_SLOTS, REQUEST_ALREADY_EXISTS, MENTOR_OFFER_CONFIRMATION_REQUIRED o IDEMPOTENCY_KEY_CONFLICT. 404 sin rol mentor en catálogo. 429 MENTOR_REQUEST_SUSPENDED con Retry-After.',
    data: MENTOR_API_SCHEMAS.activation,
    example: { id: '7dd01892-ef53-456b-8e5c-fde35324dc18' },
    auth: true,
    errors: [400, 404, 409, 429],
    status: 201,
  })
  @ApiBody(toApiBody(activateMentorSchema))
  @ApiHeader({
    name: 'Idempotency-Key',
    required: true,
    description:
      'UUID no nulo ni máximo. Reutilizar la clave con otras preferencias produce 409. El quinto intento puede iniciar sanción de 72 horas (429).',
    schema: {
      type: 'string',
      format: 'uuid',
      example: '7dd01892-ef53-456b-8e5c-fde35324dc18',
    },
  })
  @Post('activate')
  @UseGuards(JwtAuthGuard)
  activate(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(activateMentorSchema)) body: ActivateMentorDto,
    @Headers('idempotency-key') key?: string,
  ) {
    return this.mentorsService.activate(
      user.id,
      body,
      requireMentorIdempotencyKey(key),
    );
  }
}
