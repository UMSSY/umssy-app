import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  StandardSchemaValidationPipe,
  UseGuards,
  UseInterceptors,
  UsePipes,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { ResponseInterceptor } from '../../../common/interceptors/response.interceptor.js';
import { buildRequestValidationException } from '../../../common/utils/build-request-validation-exception.js';
import {
  createCustomSkillSchema,
  type CreateCustomSkillRequest,
} from '../requests/create-custom-skill.request.js';
import {
  searchSkillsSchema,
  type SearchSkillsRequest,
} from '../requests/search-skills.request.js';
import type { SkillResponse } from '../responses/skill.response.js';
import { SkillCatalogService } from '../services/skill-catalog.service.js';
import {
  apiCreateCustomSkill,
  apiListSkillCatalog,
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
@Controller('skills')
export class SkillController {
  constructor(private readonly skillCatalogService: SkillCatalogService) {}

  @Get()
  @apiListSkillCatalog()
  listCatalog(
    @Query({ schema: searchSkillsSchema }) request: SearchSkillsRequest,
  ): Promise<SkillResponse[]> {
    return this.skillCatalogService.listCatalog(request);
  }

  @Post('custom')
  @apiCreateCustomSkill()
  createCustomSkill(
    @Body({ schema: createCustomSkillSchema })
    request: CreateCustomSkillRequest,
  ): Promise<SkillResponse> {
    return this.skillCatalogService.createCustomSkill(request);
  }
}
