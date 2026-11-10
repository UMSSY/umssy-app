import {
  Body,
  Controller,
  Get,
  Put,
  StandardSchemaValidationPipe,
  UseGuards,
  UseInterceptors,
  UsePipes,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUserId } from '../../common/decorators/current-user-id.decorator.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { ResponseInterceptor } from '../../common/interceptors/response.interceptor.js';
import { buildRequestValidationException } from '../../common/utils/build-request-validation-exception.js';
import { toApiBody } from '../../common/utils/to-api-body.js';
import { PortfolioService } from './portfolio.service.js';
import {
  updatePortfolioProjectsSchema,
  type UpdatePortfolioProjectsRequest,
} from './requests/update-portfolio-projects.schema.js';
import type { PortfolioProjectDto } from './types/portfolio.types.js';

@ApiTags('profile')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'A valid access token is required' })
@UseGuards(JwtAuthGuard)
@UseInterceptors(ResponseInterceptor)
@UsePipes(
  new StandardSchemaValidationPipe({
    exceptionFactory: buildRequestValidationException,
  }),
)
@Controller('profile/portfolio')
export class PortfolioController {
  constructor(private readonly portfolioService: PortfolioService) {}

  @Get('projects')
  @ApiOperation({
    summary: 'Get featured portfolio projects of the authenticated user',
  })
  @ApiOkResponse({
    description:
      'Featured portfolio projects ordered ascending by displayOrder',
  })
  getProjects(
    @CurrentUserId() userId: string,
  ): Promise<PortfolioProjectDto[]> {
    return this.portfolioService.getProjects(userId);
  }

  @Put('projects')
  @ApiOperation({
    summary: 'Replace featured portfolio projects (maximum 6)',
  })
  @ApiBody(toApiBody(updatePortfolioProjectsSchema))
  @ApiOkResponse({
    description: 'Updated featured portfolio projects of the authenticated user',
  })
  @ApiBadRequestResponse({
    description:
      'Invalid portfolio projects payload, more than 6 projects, or duplicate repositories',
  })
  updateProjects(
    @CurrentUserId() userId: string,
    @Body({ schema: updatePortfolioProjectsSchema })
    request: UpdatePortfolioProjectsRequest,
  ): Promise<PortfolioProjectDto[]> {
    return this.portfolioService.updateProjects(userId, request.projects);
  }
}

