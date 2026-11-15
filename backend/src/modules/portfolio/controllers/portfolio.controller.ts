import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  StandardSchemaValidationPipe,
  UseGuards,
  UseInterceptors,
  UsePipes,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUserId } from '../../../common/decorators/current-user-id.decorator.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { ResponseInterceptor } from '../../../common/interceptors/response.interceptor.js';
import { buildRequestValidationException } from '../../../common/utils/build-request-validation-exception.js';
import { toApiBody } from '../../../common/utils/to-api-body.js';
import { PORTFOLIO_PROVIDERS } from '../constants/portfolio-provider.constants.js';
import {
  getPortfolioRepositoriesQuerySchema,
  type GetPortfolioRepositoriesQueryRequest,
} from '../requests/get-portfolio-repositories-query.schema.js';
import {
  oauthCallbackSchema,
  type OAuthCallbackRequest,
} from '../requests/oauth-callback.schema.js';
import {
  oauthUrlQuerySchema,
  type OAuthUrlQueryRequest,
} from '../requests/oauth-url-query.schema.js';
import { portfolioProviderParamSchema } from '../requests/portfolio-provider-param.schema.js';
import {
  updatePortfolioProjectsSchema,
  type UpdatePortfolioProjectsRequest,
} from '../requests/update-portfolio-projects.schema.js';
import type { ExternalRepositoryResponse } from '../responses/external-repository.response.js';
import type { OAuthUrlResponse } from '../responses/oauth-url.response.js';
import type { PortfolioProjectResponse } from '../responses/portfolio-project.response.js';
import type { SocialAccountStatusResponse } from '../responses/social-account-status.response.js';
import type { SocialAccountResponse } from '../responses/social-account.response.js';
import { PortfolioService } from '../services/portfolio.service.js';
import { SocialOAuthService } from '../services/social-oauth.service.js';
import type { PortfolioProvider } from '../types/portfolio-provider.type.js';

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
  constructor(
    private readonly portfolioService: PortfolioService,
    private readonly socialOAuthService: SocialOAuthService,
  ) {}

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
  ): Promise<PortfolioProjectResponse[]> {
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
  ): Promise<PortfolioProjectResponse[]> {
    return this.portfolioService.updateProjects(userId, request.projects);
  }

  @Get('accounts')
  @ApiOperation({
    summary: 'Get connected social accounts status (GitHub and GitLab)',
  })
  @ApiOkResponse({
    description: 'Connection status of supported portfolio social accounts',
  })
  getAccounts(
    @CurrentUserId() userId: string,
  ): Promise<SocialAccountStatusResponse[]> {
    return this.portfolioService.getAccounts(userId);
  }

  @Get('oauth/:provider/url')
  @ApiOperation({
    summary: 'Get OAuth authorization URL for the specified provider',
  })
  @ApiParam({ name: 'provider', enum: PORTFOLIO_PROVIDERS })
  @ApiQuery({ name: 'state', required: false, type: String })
  @ApiOkResponse({
    description: 'OAuth authorization URL for GitHub or GitLab',
  })
  @ApiBadRequestResponse({
    description: 'Unsupported social provider',
  })
  getOAuthUrl(
    @Param('provider', { schema: portfolioProviderParamSchema })
    provider: PortfolioProvider,
    @Query({ schema: oauthUrlQuerySchema })
    query: OAuthUrlQueryRequest,
  ): OAuthUrlResponse {
    return this.socialOAuthService.getAuthorizationUrl(provider, query.state);
  }

  @Post('oauth/:provider/callback')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Connect a social account using the OAuth authorization code',
  })
  @ApiParam({ name: 'provider', enum: PORTFOLIO_PROVIDERS })
  @ApiBody(toApiBody(oauthCallbackSchema))
  @ApiOkResponse({
    description: 'Connected social account details',
  })
  @ApiBadRequestResponse({
    description: 'Invalid OAuth authorization code or provider exchange error',
  })
  @ApiConflictResponse({
    description: 'Social account is already linked to another user',
  })
  connectOAuthAccount(
    @CurrentUserId() userId: string,
    @Param('provider', { schema: portfolioProviderParamSchema })
    provider: PortfolioProvider,
    @Body({ schema: oauthCallbackSchema })
    request: OAuthCallbackRequest,
  ): Promise<SocialAccountResponse> {
    return this.socialOAuthService.connectWithCode(
      userId,
      provider,
      request.code,
    );
  }

  @Get('repositories')
  @ApiOperation({
    summary: 'Get public repositories of connected accounts',
  })
  @ApiQuery({
    name: 'provider',
    enum: PORTFOLIO_PROVIDERS,
    required: false,
  })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiOkResponse({
    description: 'List of external repositories ordered by most recently updated',
  })
  getRepositories(
    @CurrentUserId() userId: string,
    @Query({ schema: getPortfolioRepositoriesQuerySchema })
    query: GetPortfolioRepositoriesQueryRequest,
  ): Promise<ExternalRepositoryResponse[]> {
    return this.portfolioService.getRepositories(userId, query);
  }
}
