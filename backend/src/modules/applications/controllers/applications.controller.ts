import { Controller, Get, Patch, Param, Query, Request } from '@nestjs/common';
import { ApplicationsService } from '../services/applications.service.js';
import { findApplicationsQuerySchema, FindApplicationsQueryDto } from '../requests/find-applications.request.js';

@Controller('applications')
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Get('me')
  async findMyApplications(@Request() req: any, @Query() queryParams: any) {
    const validatedQuery: FindApplicationsQueryDto = findApplicationsQuerySchema.parse(queryParams);
    return this.applicationsService.findMyApplications(req.user?.id || 'user-1', validatedQuery);
  }

  @Patch(':id/withdraw')
  async withdrawApplication(@Param('id') id: string, @Request() req: any) {
    return this.applicationsService.withdrawApplication(id, req.user?.id || 'user-1');
  }
}