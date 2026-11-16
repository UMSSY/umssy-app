import {
  Body,
  Controller,
  Get,
  Post,
  Put,
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
  updateUserSkillsSchema,
  type UpdateUserSkillsRequest,
} from '../requests/update-user-skills.request.js';
import type { OwnSkillResponse } from '../responses/own-skill.response.js';
import { UserSkillService } from '../services/user-skill.service.js';
import {
  apiAddOwnSkills,
  apiGetOwnSkills,
  apiReplaceOwnSkills,
} from '../swagger/skills.swagger.js';

@ApiTags('skills')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@UseInterceptors(ResponseInterceptor)
@UsePipes(
  new StandardSchemaValidationPipe({
    exceptionFactory: buildRequestValidationException,
  }),
)
@Controller('profile/me/skills')
export class UserSkillController {
  constructor(private readonly userSkillService: UserSkillService) {}

  @Get()
  @apiGetOwnSkills()
  getUserSkills(@CurrentUserId() userId: string): Promise<OwnSkillResponse[]> {
    return this.userSkillService.getUserSkills(userId);
  }

  @Put()
  @apiReplaceOwnSkills()
  updateUserSkills(
    @CurrentUserId() userId: string,
    @Body({ schema: updateUserSkillsSchema }) request: UpdateUserSkillsRequest,
  ): Promise<OwnSkillResponse[]> {
    return this.userSkillService.updateUserSkills(userId, request);
  }

  @Post()
  @apiAddOwnSkills()
  addSkills(
    @CurrentUserId() userId: string,
    @Body({ schema: updateUserSkillsSchema }) request: UpdateUserSkillsRequest,
  ): Promise<OwnSkillResponse[]> {
    return this.userSkillService.addSkills(userId, request);
  }
}
