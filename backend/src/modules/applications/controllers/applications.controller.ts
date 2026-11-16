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
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUserId } from '../../../common/decorators/current-user-id.decorator.js';
import { Roles } from '../../../common/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../../common/guards/roles.guard.js';
import { buildRequestValidationException } from '../../../common/utils/build-request-validation-exception.js';
import { ApplicationsService } from '../services/applications.service.js';
import { ApplicationNotFoundException } from '../exceptions/application-not-found.exception.js';
import {
  apiFindMyApplications,
  apiGetApplicationContact,
  apiReactivateApplication,
  apiWithdrawApplication,
} from '../swagger/applications.swagger.js';
import {
  findApplicationsQuerySchema,
  type FindApplicationsQueryDto,
} from '../requests/find-applications.request.js';

const applicationIdPipe = new ParseUUIDPipe({
  exceptionFactory: () => new ApplicationNotFoundException(),
});

@ApiTags('applications')
@ApiBearerAuth()
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
  @apiFindMyApplications()
  findMyApplications(
    @CurrentUserId() userId: string,
    @Query({ schema: findApplicationsQuerySchema })
    query: FindApplicationsQueryDto,
  ) {
    return this.applicationsService.findMyApplications(userId, query);
  }

  @Patch(':id/reactivate')
  @HttpCode(HttpStatus.NO_CONTENT)
  @apiReactivateApplication()
  reactivateApplication(
    @Param('id', applicationIdPipe) id: string,
    @CurrentUserId() userId: string,
  ) {
    return this.applicationsService.reactivateApplication(id, userId);
  }

  @Get(':id/contact')
  @apiGetApplicationContact()
  getApplicationContact(
    @Param('id', applicationIdPipe) id: string,
    @CurrentUserId() userId: string,
  ) {
    return this.applicationsService.getApplicationContact(id, userId);
  }

  @Patch(':id/withdraw')
  @HttpCode(HttpStatus.NO_CONTENT)
  @apiWithdrawApplication()
  withdrawApplication(
    @Param('id', applicationIdPipe) id: string,
    @CurrentUserId() userId: string,
  ) {
    return this.applicationsService.withdrawApplication(id, userId);
  }
}
