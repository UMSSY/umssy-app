import {
  Body,
  Controller,
  Delete,
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
  ApiBadGatewayResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiServiceUnavailableResponse,
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
import type { SocialAccountDisconnectResponse } from '../responses/social-account-disconnect.response.js';
import type { SocialAccountResponse } from '../responses/social-account.response.js';
import { PortfolioService } from '../services/portfolio.service.js';
import { SocialOAuthService } from '../services/social-oauth.service.js';
import type { PortfolioProvider } from '../types/portfolio-provider.type.js';

@ApiTags('profile')
@ApiBearerAuth()
@ApiUnauthorizedResponse({
  description: 'A valid access token is required',
  schema: { $ref: '#/components/schemas/ApiErrorResponse' },
})
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
    description:
      'Updated featured portfolio projects of the authenticated user',
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

  @Post('projects/sync')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Synchronize portfolio projects with remote provider repositories',
  })
  @ApiOkResponse({
    description: 'Updated list of synchronized portfolio projects',
  })
  syncProjects(
    @CurrentUserId() userId: string,
  ): Promise<PortfolioProjectResponse[]> {
    return this.portfolioService.syncProjects(userId);
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

  @Delete('accounts/:provider')
  @ApiOperation({
    summary:
      'Disconnect a social account and remove its associated portfolio projects',
  })
  @ApiParam({ name: 'provider', enum: PORTFOLIO_PROVIDERS })
  @ApiOkResponse({
    description: 'Social account disconnected successfully',
  })
  @ApiNotFoundResponse({
    description: 'Social account is not connected',
  })
  disconnectAccount(
    @CurrentUserId() userId: string,
    @Param('provider', { schema: portfolioProviderParamSchema })
    provider: PortfolioProvider,
  ): Promise<SocialAccountDisconnectResponse> {
    return this.portfolioService.disconnectSocialAccount(userId, provider);
  }

  @Get('oauth/:provider/url')
  @ApiOperation({
    operationId: 'getPortfolioOAuthAuthorizationUrl',
    summary: 'Get OAuth authorization URL for the specified provider',
    description:
      'GitHub and GitLab require an S256 PKCE challenge.',
  })
  @ApiParam({ name: 'provider', enum: PORTFOLIO_PROVIDERS })
  @ApiQuery({ name: 'state', required: false, type: String })
  @ApiQuery({
    name: 'challenge',
    required: false,
    type: String,
    description:
      'Required: 43-character base64url SHA-256 PKCE challenge.',
  })
  @ApiOkResponse({
    description: 'OAuth authorization URL for GitHub or GitLab',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 200 },
        ok: { type: 'boolean', example: true },
        detail: { type: 'string', example: 'OK' },
        data: {
          type: 'object',
          required: ['url'],
          properties: { url: { type: 'string', format: 'uri' } },
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Unsupported provider or missing or invalid challenge',
    schema: { $ref: '#/components/schemas/ApiErrorResponse' },
  })
  @ApiServiceUnavailableResponse({
    description:
      'OAuth credentials or callback configuration are unavailable for the provider',
    schema: { $ref: '#/components/schemas/ApiErrorResponse' },
  })
  getOAuthUrl(
    @CurrentUserId() userId: string,
    @Param('provider', { schema: portfolioProviderParamSchema })
    provider: PortfolioProvider,
    @Query({ schema: oauthUrlQuerySchema })
    query: OAuthUrlQueryRequest,
  ): OAuthUrlResponse {
    return this.socialOAuthService.getAuthorizationUrl(
      provider,
      query.state,
      userId,
      query.challenge,
    );
  }

  @Post('oauth/:provider/callback')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    operationId: 'completePortfolioOAuthAuthorization',
    summary: 'Connect a social account using the OAuth authorization code',
    description:
      'GitHub and GitLab require code, state and verifier from the same authorization attempt.',
  })
  @ApiParam({ name: 'provider', enum: PORTFOLIO_PROVIDERS })
  @ApiBody({
    ...toApiBody(oauthCallbackSchema),
    description:
      'GitHub and GitLab require code, state and verifier from the same authorization attempt.',
  })
  @ApiOkResponse({
    description: 'Connected social account details',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 200 },
        ok: { type: 'boolean', example: true },
        detail: { type: 'string', example: 'OK' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            provider: { type: 'string', enum: [...PORTFOLIO_PROVIDERS] },
            username: { type: 'string' },
            profileUrl: { type: 'string', nullable: true },
            connected: { type: 'boolean' },
          },
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid OAuth authorization code, missing state or verifier, or provider exchange error',
    schema: { $ref: '#/components/schemas/ApiErrorResponse' },
  })
  @ApiConflictResponse({
    description: 'Social account is already linked to another user',
    schema: { $ref: '#/components/schemas/ApiErrorResponse' },
  })
  @ApiBadGatewayResponse({
    description: 'GitHub or GitLab is unavailable',
    schema: { $ref: '#/components/schemas/ApiErrorResponse' },
  })
  @ApiServiceUnavailableResponse({
    description: 'OAuth credentials or callback configuration are unavailable for the provider',
    schema: { $ref: '#/components/schemas/ApiErrorResponse' },
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
      request.state,
      request.verifier,
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
    description:
      'List of external repositories ordered by most recently updated',
  })
  getRepositories(
    @CurrentUserId() userId: string,
    @Query({ schema: getPortfolioRepositoriesQuerySchema })
    query: GetPortfolioRepositoriesQueryRequest,
  ): Promise<ExternalRepositoryResponse[]> {
    return this.portfolioService.getRepositories(userId, query);
  }
}
