import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator.js';
import { Roles } from '../../../common/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../../common/guards/roles.guard.js';
import type { AuthenticatedUser } from '../../../common/types/authenticated-user.types.js';
import {
  FIND_MENTOR_FREE_BLOCKS_DOCS,
  FIND_MY_AVAILABILITY_STATUS_DOCS,
  UPDATE_AVAILABILITY_STATUS_DOCS,
} from '../constants/availability-docs.constants.js';
import { MentorParamsDto } from '../requests/mentor-params.request.js';
import { UpdateMentorAvailabilityDto } from '../requests/update-mentor-availability.request.js';
import { WeekQueryDto } from '../requests/week-query.request.js';
import { AvailabilityService } from '../services/availability.service.js';
import type { AvailabilityBlockResponse } from '../types/availability-block-response.types.js';
import type { MentorAvailabilityStatusResponse } from '../types/mentor-availability-status-response.types.js';

@Controller('mentors')
@ApiBearerAuth()
export class MentorAvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  @Get('me/availability')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('mentor')
  @ApiOperation({ summary: FIND_MY_AVAILABILITY_STATUS_DOCS.summary })
  findMyAvailabilityStatus(@CurrentUser() user: AuthenticatedUser): Promise<MentorAvailabilityStatusResponse> {
    return this.availabilityService.findMyAvailabilityStatus(user.id);
  }

  @Patch(':id/availability')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('mentor')
  @ApiOperation({ summary: UPDATE_AVAILABILITY_STATUS_DOCS.summary, description: UPDATE_AVAILABILITY_STATUS_DOCS.description })
  @ApiParam({ name: 'id', description: UPDATE_AVAILABILITY_STATUS_DOCS.idDescription })
  updateAvailabilityStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param() params: MentorParamsDto,
    @Body() body: UpdateMentorAvailabilityDto,
  ): Promise<MentorAvailabilityStatusResponse> {
    return this.availabilityService.updateAvailabilityStatus(user.id, params.id, body.isAvailable);
  }

  @Get(':id/free-blocks')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('titulado', 'estudiante', 'mentor')
  @ApiOperation({ summary: FIND_MENTOR_FREE_BLOCKS_DOCS.summary })
  @ApiParam({ name: 'id', description: FIND_MENTOR_FREE_BLOCKS_DOCS.idDescription })
  @ApiQuery({ name: 'from', description: FIND_MENTOR_FREE_BLOCKS_DOCS.fromDescription })
  @ApiQuery({ name: 'to', description: FIND_MENTOR_FREE_BLOCKS_DOCS.toDescription })
  findMentorFreeBlocks(
    @Param() params: MentorParamsDto,
    @Query() query: WeekQueryDto,
  ): Promise<AvailabilityBlockResponse[]> {
    return this.availabilityService.findMentorFreeBlocks(params.id, query);
  }
}
