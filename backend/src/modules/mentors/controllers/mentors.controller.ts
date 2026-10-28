import {
  Body,
  Controller,
  Get,
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
import {
  mentorDirectoryQuerySchema,
  type MentorDirectoryQuery,
} from '../requests/mentor-directory-query.schema.js';

@Controller('mentors')
@UseInterceptors(ResponseInterceptor)
export class MentorsController {
  constructor(private readonly mentorsService: MentorsService) {}

  @Get()
  findAll() {
    return this.mentorsService.findAll();
  }

  @Get('directory')
  @UseGuards(JwtAuthGuard)
  findDirectory(
    @Query(new RequestValidationPipe(mentorDirectoryQuerySchema))
    query: MentorDirectoryQuery,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.mentorsService.findDirectory(query, user.id);
  }

  @Get('me/technical-areas')
  @UseGuards(JwtAuthGuard)
  findMyTechnicalAreas(@CurrentUser() user: AuthenticatedUser) {
    return this.mentorsService.findMyTechnicalAreas(user.id);
  }

  @Get('me/participation')
  @UseGuards(JwtAuthGuard)
  findMyParticipation(@CurrentUser() user: AuthenticatedUser) {
    return this.mentorsService.findMyParticipation(user.id);
  }

  @Patch('me/technical-areas')
  @UseGuards(JwtAuthGuard)
  updateMyTechnicalAreas(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(updateMentorTechnicalAreasSchema))
    body: UpdateMentorTechnicalAreasDto,
  ) {
    return this.mentorsService.updateMyTechnicalAreas(user.id, body);
  }

  @Get('me/orientation-types')
  @UseGuards(JwtAuthGuard)
  findMyOrientationTypes(@CurrentUser() user: AuthenticatedUser) {
    return this.mentorsService.findMyOrientationTypes(user.id);
  }

  @Patch('me/orientation-types')
  @UseGuards(JwtAuthGuard)
  updateMyOrientationTypes(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(updateMentorOrientationTypesSchema))
    body: UpdateMentorOrientationTypesDto,
  ) {
    return this.mentorsService.updateMyOrientationTypes(user.id, body);
  }

  @Get('capacity')
  @UseGuards(JwtAuthGuard)
  capacity() {
    return this.mentorsService.capacity();
  }

  @Get(':userId')
  findOne(
    @Param('userId', new ParseUUIDPipe({ version: '4' })) userId: string,
  ) {
    return this.mentorsService.findOne(userId);
  }

  @Post('activate')
  @UseGuards(JwtAuthGuard)
  activate(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(activateMentorSchema)) body: ActivateMentorDto,
  ) {
    return this.mentorsService.activate(user.id, body);
  }
}
