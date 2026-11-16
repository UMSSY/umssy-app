import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  StandardSchemaValidationPipe,
  UseGuards,
  UseInterceptors,
  UsePipes,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUserId } from '../../../common/decorators/current-user-id.decorator.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { ResponseInterceptor } from '../../../common/interceptors/response.interceptor.js';
import { buildRequestValidationException } from '../../../common/utils/build-request-validation-exception.js';
import {
  createWorkExperienceSchema,
  type CreateWorkExperienceRequest,
} from '../requests/create-work-experience.request.js';
import {
  updateWorkExperienceSchema,
  type UpdateWorkExperienceRequest,
} from '../requests/update-work-experience.request.js';
import { workExperienceIdSchema } from '../requests/work-experience-fields.schema.js';
import type { WorkExperienceResponse } from '../responses/work-experience.response.js';
import { WorkExperienceService } from '../services/work-experience.service.js';
import {
  apiCreateWorkExperience,
  apiDeleteWorkExperience,
  apiListWorkExperiences,
  apiUpdateWorkExperience,
} from '../swagger/work-experience.swagger.js';

@ApiTags('work-experience')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@UseInterceptors(ResponseInterceptor)
@UsePipes(
  new StandardSchemaValidationPipe({
    exceptionFactory: buildRequestValidationException,
  }),
)
@Controller('work-experiences')
export class WorkExperienceController {
  constructor(private readonly service: WorkExperienceService) {}

  @Get()
  @apiListWorkExperiences()
  findAll(@CurrentUserId() userId: string): Promise<WorkExperienceResponse[]> {
    return this.service.findAll(userId);
  }

  @Post()
  @apiCreateWorkExperience()
  create(
    @CurrentUserId() userId: string,
    @Body({ schema: createWorkExperienceSchema })
    request: CreateWorkExperienceRequest,
  ): Promise<WorkExperienceResponse> {
    return this.service.create(userId, request);
  }

  @Patch(':id')
  @apiUpdateWorkExperience()
  update(
    @CurrentUserId() userId: string,
    @Param('id', { schema: workExperienceIdSchema }) id: string,
    @Body({ schema: updateWorkExperienceSchema })
    request: UpdateWorkExperienceRequest,
  ): Promise<WorkExperienceResponse> {
    return this.service.update(userId, id, request);
  }

  @Delete(':id')
  @apiDeleteWorkExperience()
  remove(
    @CurrentUserId() userId: string,
    @Param('id', { schema: workExperienceIdSchema }) id: string,
  ): Promise<void> {
    return this.service.remove(userId, id);
  }
}
