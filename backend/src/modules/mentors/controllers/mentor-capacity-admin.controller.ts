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

@Controller('admin/mentor-capacity')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(ResponseInterceptor)
@Roles('administrativo')
export class MentorCapacityAdminController {
  constructor(private readonly service: MentorCapacityAdminService) {}

  @Get()
  getOverview() {
    return this.service.getOverview();
  }

  @Put()
  updatePercentage(
    @Body(new ZodValidationPipe(updateMentorCapacitySchema))
    body: UpdateMentorCapacityDto,
  ) {
    return this.service.updatePercentage(body.percentage);
  }

  @Get('requests')
  listWaitingRequests(
    @Query(new ZodValidationPipe(mentorCapacityListSchema))
    query: MentorCapacityListQuery,
  ) {
    return this.service.listWaitingRequests(query.page, query.limit);
  }

  @Get('offers')
  listOfferHistory(
    @Query(new ZodValidationPipe(mentorCapacityListSchema))
    query: MentorCapacityListQuery,
  ) {
    return this.service.listOfferHistory(query.page, query.limit);
  }
}
