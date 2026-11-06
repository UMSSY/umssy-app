import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ZodValidationPipe } from 'nestjs-zod';
import { CurrentUser } from '../../../common/decorators/current-user.decorator.js';
import { Roles } from '../../../common/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../../common/guards/roles.guard.js';
import type { AuthenticatedUser } from '../../../common/types/authenticated-user.types.js';
import {
  BLOCK_DATE_DOCS,
  FIND_BLOCKED_DATES_DOCS,
  UNBLOCK_DATE_DOCS,
} from '../constants/availability-docs.constants.js';
import { BlockDateDto } from '../requests/block-date.request.js';
import { blockedDateIdSchema } from '../requests/blocked-date-id.request.js';
import { BlockedDatesQueryDto } from '../requests/blocked-dates-query.request.js';
import { BlockedDatesService } from '../services/blocked-dates.service.js';
import type { BlockedDateResponse } from '../types/blocked-date-response.types.js';
import type { DeletedBlockedDateResponse } from '../types/deleted-blocked-date-response.types.js';

@Controller('blocked-dates')
@ApiBearerAuth()
export class BlockedDatesController {
  constructor(private readonly blockedDatesService: BlockedDatesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('mentor')
  @ApiOperation({ summary: BLOCK_DATE_DOCS.summary, description: BLOCK_DATE_DOCS.description })
  blockDate(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: BlockDateDto,
  ): Promise<BlockedDateResponse> {
    return this.blockedDatesService.blockDate(user.id, body);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('mentor')
  @ApiOperation({ summary: FIND_BLOCKED_DATES_DOCS.summary })
  @ApiQuery({ name: 'from', description: FIND_BLOCKED_DATES_DOCS.fromDescription })
  @ApiQuery({ name: 'to', required: false, description: FIND_BLOCKED_DATES_DOCS.toDescription })
  findBlockedDates(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: BlockedDatesQueryDto,
  ): Promise<BlockedDateResponse[]> {
    return this.blockedDatesService.findBlockedDates(user.id, query);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('mentor')
  @ApiOperation({ summary: UNBLOCK_DATE_DOCS.summary })
  @ApiParam({ name: 'id', description: UNBLOCK_DATE_DOCS.idDescription })
  unblockDate(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ZodValidationPipe(blockedDateIdSchema)) id: string,
  ): Promise<DeletedBlockedDateResponse> {
    return this.blockedDatesService.unblockDate(user.id, id);
  }
}
