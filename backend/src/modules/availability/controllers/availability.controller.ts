import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBadRequestResponse, ApiBearerAuth, ApiCreatedResponse, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ZodValidationPipe } from 'nestjs-zod';
import { CurrentUser } from '../../../common/decorators/current-user.decorator.js';
import { Roles } from '../../../common/decorators/roles.decorator.js';
import type { AuthenticatedUser } from '../../../common/types/authenticated-user.types.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../../common/guards/roles.guard.js';
import {
  CREATE_BLOCK_DOCS,
  DELETE_BLOCK_DOCS,
  FIND_MY_BLOCKS_DOCS,
  UPDATE_BLOCK_DOCS,
} from '../constants/availability-docs.constants.js';
import { CreateBlockDto } from '../requests/create-block.request.js';
import { WeekQueryDto } from '../requests/week-query.request.js';
import { blockIdSchema } from '../requests/block-id.request.js';
import { UpdateBlockDto } from '../requests/update-block.request.js';
import { AvailabilityService } from '../services/availability.service.js';
import type { AvailabilityBlockResponse } from '../types/availability-block-response.types.js';
import type { DeletedBlockResponse } from '../types/deleted-block-response.types.js';
import type { WeeklyRepeatResponse } from '../types/weekly-repeat-response.types.js';
import type { OwnerAvailabilityBlockResponse } from '../types/owner-availability-block-response.types.js';

@Controller('availability-blocks')
@ApiBearerAuth()
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('mentor')
  @ApiOperation({ summary: CREATE_BLOCK_DOCS.summary, description: CREATE_BLOCK_DOCS.description })
  @ApiCreatedResponse({ description: CREATE_BLOCK_DOCS.createdResponse })
  @ApiBadRequestResponse({ description: CREATE_BLOCK_DOCS.badRequestResponse })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: CreateBlockDto,
  ): Promise<AvailabilityBlockResponse | WeeklyRepeatResponse> {
    return this.availabilityService.create(user.id, body);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('mentor')
  @ApiOperation({ summary: FIND_MY_BLOCKS_DOCS.summary, description: FIND_MY_BLOCKS_DOCS.description })
  @ApiQuery({ name: 'from', description: FIND_MY_BLOCKS_DOCS.fromDescription })
  @ApiQuery({ name: 'to', description: FIND_MY_BLOCKS_DOCS.toDescription })
  findMyBlocks(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: WeekQueryDto,
  ): Promise<OwnerAvailabilityBlockResponse[]> {
    return this.availabilityService.findMyBlocks(user.id, query);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('mentor')
  @ApiOperation({ summary: UPDATE_BLOCK_DOCS.summary })
  @ApiParam({ name: 'id', description: UPDATE_BLOCK_DOCS.idDescription })
  updateBlock(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ZodValidationPipe(blockIdSchema)) id: string,
    @Body() body: UpdateBlockDto,
  ): Promise<AvailabilityBlockResponse> {
    return this.availabilityService.updateBlock(user.id, id, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('mentor')
  @ApiOperation({ summary: DELETE_BLOCK_DOCS.summary, description: DELETE_BLOCK_DOCS.description })
  @ApiParam({ name: 'id', description: DELETE_BLOCK_DOCS.idDescription })
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ZodValidationPipe(blockIdSchema)) id: string,
  ): Promise<DeletedBlockResponse> {
    return this.availabilityService.remove(user.id, id);
  }
}
