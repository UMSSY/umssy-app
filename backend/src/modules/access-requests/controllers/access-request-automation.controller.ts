import { Controller, Get, Param, ParseUUIDPipe, Patch, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator.js';
import { Roles } from '../../../common/decorators/roles.decorator.js';
import { RequestValidationException } from '../../../common/exceptions/request-validation.exception.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../../common/guards/roles.guard.js';
import type { AuthenticatedUser } from '../../../common/types/authenticated-user.types.js';
import { AuditEventTimelineService } from '../../audit-events/services/audit-event-timeline.service.js';
import { BACKOFFICE_ROLE } from '../constants/backoffice.constants.js';
import { AutomaticValidationService } from '../services/automatic-validation.service.js';

const uuidPipe = new ParseUUIDPipe({
  exceptionFactory: () => new RequestValidationException([{ field: 'id', message: 'El identificador de la solicitud no es válido' }]),
});

@ApiTags('Validación automática')
@Controller('access-requests')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(BACKOFFICE_ROLE)
export class AccessRequestAutomationController {
  constructor(
    private readonly automaticValidationService: AutomaticValidationService,
    private readonly auditEventTimelineService: AuditEventTimelineService,
  ) {}

  @Get('automation-summary')
  getSummary() {
    return this.automaticValidationService.getSummary();
  }

  @Get(':id/history')
  getHistory(@Param('id', uuidPipe) id: string) {
    return this.auditEventTimelineService.listForRequest(id);
  }

  @Patch(':id/revert-approval')
  revertApproval(@Param('id', uuidPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.automaticValidationService.revertApproval(id, user.id);
  }
}
