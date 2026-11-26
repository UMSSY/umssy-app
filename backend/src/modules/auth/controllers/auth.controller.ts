import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import {
  AUTH_GOOGLE_BODY,
  AUTH_GOOGLE_LINK_OK_RESPONSE,
  AUTH_LOGIN_BODY,
  AUTH_PASSWORD_RESET_BODY,
  AUTH_PASSWORD_RESET_REQUEST_BODY,
  AUTH_PASSWORD_RESET_VERIFY_BODY,
  AUTH_REFRESH_OK_RESPONSE,
  AUTH_SESSION_OK_RESPONSE,
  AUTH_TOKEN_CREATED_RESPONSE,
} from '../constants/auth-openapi.constants.js';
import { CREDENTIAL_LIMIT_RESPONSE } from '../constants/credential-limit-response.constants.js';
import { CredentialLimitsService } from '../services/credential-limits.service.js';
import { AuthService } from '../services/auth.service.js';
import { RefreshTokenService } from '../services/refresh-token.service.js';
import {
  REFRESH_TOKEN_COOKIE,
} from '../../../common/constants/auth.constants.js';
import { CurrentUser } from '../../../common/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { DomainException } from '../../../common/exceptions/domain.exception.js';
import type { AuthenticatedUser } from '../../../common/types/authenticated-user.types.js';
import {
  clearSessionCookies,
  writeSessionCookies,
} from '../utils/session-cookies.util.js';
import { LoginDto } from '../requests/login.schema.js';
import { GoogleLoginDto } from '../requests/google-login.schema.js';
import { GoogleLinkDto } from '../requests/google-link.schema.js';
import { GoogleAuthService } from '../services/google-auth.service.js';
import {
  InvalidCredentialsException,
  MissingGoogleCredentialException,
} from '../exceptions/index.js';
import { RequestPasswordResetDto } from '../requests/request-password-reset.schema.js';
import { VerifyPasswordResetDto } from '../requests/verify-password-reset.schema.js';
import { ResetPasswordDto } from '../requests/reset-password.schema.js';

function readRefreshCookie(request?: Request): string | undefined {
  const value: unknown = request?.cookies?.[REFRESH_TOKEN_COOKIE];
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

@ApiTags('Autenticación')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly refreshTokens: RefreshTokenService,
    private readonly credentialLimits: CredentialLimitsService,
    private readonly googleAuthService: GoogleAuthService,
  ) {}

  @Get('session')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    operationId: 'auth_getSession',
    summary: 'Obtener sesión activa',
    description:
      'Devuelve la identidad autenticada, roles activos y límites de inactividad calculados desde la familia de refresh.',
  })
  @ApiOkResponse(AUTH_SESSION_OK_RESPONSE)
  @ApiUnauthorizedResponse({
    description: 'Sesión no autenticada o credencial expirada.',
  })
  async getSession(
    @CurrentUser() user: AuthenticatedUser,
    @Req() request?: Request,
  ) {
    const absoluteExpiresAt = await this.refreshTokens.getAbsoluteExpiry(
      readRefreshCookie(request),
    );
    return this.authService.getSession(user, absoluteExpiresAt);
  }

  @Post('login')
  @ApiOperation({
    operationId: 'auth_login',
    summary: 'Iniciar sesión con correo y contraseña',
    description:
      'Autentica credenciales, emite cookies HttpOnly de sesión y aplica control de intentos fallidos.',
  })
  @ApiBody(AUTH_LOGIN_BODY)
  @ApiCreatedResponse(AUTH_TOKEN_CREATED_RESPONSE)
  @ApiBadRequestResponse({ description: 'Cuerpo de solicitud inválido.' })
  @ApiUnauthorizedResponse({ description: 'Credenciales incorrectas.' })
  @ApiResponse(CREDENTIAL_LIMIT_RESPONSE)
  async login(
    @Body() body: LoginDto,
    @Res({ passthrough: true }) response: Response,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.credentialLimits.run('login', body.email, async () => {
      const result = await this.authService.login(body);
      const session = await this.refreshTokens.startFromLogin(
        result.accessToken,
        userAgent,
      );
      writeSessionCookies(response, session);
      return { ...result, accessToken: session.accessToken };
    });
  }

  @Post('google/login')
  @ApiOperation({
    operationId: 'auth_googleLogin',
    summary: 'Iniciar sesión con Google OAuth',
    description:
      'Verifica el token de Google Identity Services y establece cookies HttpOnly de sesión.',
  })
  @ApiBody(AUTH_GOOGLE_BODY)
  @ApiCreatedResponse(AUTH_TOKEN_CREATED_RESPONSE)
  @ApiBadRequestResponse({ description: 'Credencial de Google ausente o inválida.' })
  @ApiUnauthorizedResponse({ description: 'Token de Google no autorizado.' })
  @ApiForbiddenResponse({
    description: 'El rol del usuario no permite acceso con Google.',
  })
  @ApiResponse(CREDENTIAL_LIMIT_RESPONSE)
  async googleLogin(
    @Body() body: GoogleLoginDto,
    @Res({ passthrough: true }) response: Response,
    @Headers('user-agent') userAgent?: string,
  ) {
    const token = body.credential ?? body.idToken;
    if (!token) {
      throw new InvalidCredentialsException(
        'Credencial de Google no proporcionada.',
      );
    }

    const verifiedUser = await this.googleAuthService.verifyCredential(token);

    return this.credentialLimits.run('login', verifiedUser.email, async () => {
      const result = await this.authService.loginWithGoogle(
        verifiedUser,
        body.roleTag,
      );
      const session = await this.refreshTokens.startFromLogin(
        result.accessToken,
        userAgent,
      );
      writeSessionCookies(response, session);

      return { ...result, accessToken: session.accessToken };
    });
  }

  @Post('google/link')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    operationId: 'auth_googleLink',
    summary: 'Vincular cuenta de Google',
    description:
      'Asocia una cuenta de Google verificada al usuario autenticado actual.',
  })
  @ApiBody(AUTH_GOOGLE_BODY)
  @ApiCreatedResponse(AUTH_GOOGLE_LINK_OK_RESPONSE)
  @ApiBadRequestResponse({ description: 'Credencial de Google faltante o inválida.' })
  @ApiUnauthorizedResponse({ description: 'Sesión no autenticada.' })
  @ApiConflictResponse({
    description: 'La cuenta de Google ya está vinculada o el correo no coincide.',
  })
  async googleLink(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: GoogleLinkDto,
  ) {
    const token = body.credential ?? body.idToken;
    if (!token) {
      throw new MissingGoogleCredentialException();
    }

    const verifiedGoogle = await this.googleAuthService.verifyCredential(token);

    return this.authService.linkGoogle(user, verifiedGoogle);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    operationId: 'auth_refresh',
    summary: 'Rotar tokens de sesión',
    description:
      'Valida la cookie HttpOnly de refresh, detecta reuso, rota el par de tokens y actualiza cookies de sesión.',
  })
  @ApiOkResponse(AUTH_REFRESH_OK_RESPONSE)
  @ApiUnauthorizedResponse({
    description: 'Refresh token inválido, expirado o reutilizado.',
  })
  async refresh(
    @Res({ passthrough: true }) response: Response,
    @Req() request?: Request,
    @Headers('user-agent') userAgent?: string,
  ) {
    try {
      const session = await this.refreshTokens.rotate(
        readRefreshCookie(request),
        userAgent,
      );
      writeSessionCookies(response, session);
      return {
        accessToken: session.accessToken,
        roleTag: session.roleTag,
        roles: session.roles,
      };
    } catch (error) {
      if (error instanceof DomainException && error.statusCode === 401) {
        clearSessionCookies(response);
      }
      throw error;
    }
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    operationId: 'auth_logout',
    summary: 'Cerrar sesión',
    description:
      'Revoca la familia activa del token de refresh y limpia las cookies de sesión.',
  })
  @ApiNoContentResponse({
    description: 'Sesión cerrada y cookies limpiadas correctamente.',
  })
  async logout(
    @Res({ passthrough: true }) response: Response,
    @Req() request?: Request,
  ): Promise<void> {
    await this.refreshTokens.revokeByToken(readRefreshCookie(request));
    clearSessionCookies(response);
  }

  @Post('forgot-password/request')
  @ApiOperation({
    operationId: 'auth_requestPasswordReset',
    summary: 'Solicitar código OTP de recuperación',
    description:
      'Genera y envía un código OTP temporal para restablecer contraseña sujeto a límites por cuenta.',
  })
  @ApiBody(AUTH_PASSWORD_RESET_REQUEST_BODY)
  @ApiCreatedResponse({
    description: 'Solicitud procesada correctamente.',
  })
  @ApiBadRequestResponse({ description: 'Correo inválido.' })
  @ApiResponse(CREDENTIAL_LIMIT_RESPONSE)
  requestPasswordReset(@Body() body: RequestPasswordResetDto) {
    return this.credentialLimits.run('request', body.email, () =>
      this.authService.requestPasswordReset(body),
    );
  }

  @Post('forgot-password/verify')
  @ApiOperation({
    operationId: 'auth_verifyPasswordReset',
    summary: 'Verificar código OTP de recuperación',
    description:
      'Valida el código OTP ingresado antes de permitir el cambio de contraseña.',
  })
  @ApiBody(AUTH_PASSWORD_RESET_VERIFY_BODY)
  @ApiCreatedResponse({ description: 'Código OTP válido.' })
  @ApiBadRequestResponse({ description: 'Código OTP inválido o expirado.' })
  @ApiResponse(CREDENTIAL_LIMIT_RESPONSE)
  verifyPasswordReset(@Body() body: VerifyPasswordResetDto) {
    return this.credentialLimits.run('verify', body.email, () =>
      this.authService.verifyPasswordReset(body),
    );
  }

  @Post('forgot-password/reset')
  @ApiOperation({
    operationId: 'auth_resetPassword',
    summary: 'Restablecer contraseña con OTP',
    description:
      'Actualiza la contraseña validando historial reciente y revoca cadenas de refresh activas.',
  })
  @ApiBody(AUTH_PASSWORD_RESET_BODY)
  @ApiCreatedResponse({ description: 'Contraseña restablecida correctamente.' })
  @ApiResponse(CREDENTIAL_LIMIT_RESPONSE)
  @ApiResponse({
    status: 400,
    description: 'Código no válido o contraseña reutilizada (PASSWORD_REUSED).',
  })
  @ApiResponse({
    status: 409,
    description: 'Otro cambio de contraseña invalidó la comprobación (PASSWORD_RESET_CONFLICT).',
  })
  resetPassword(@Body() body: ResetPasswordDto) {
    return this.credentialLimits.run('reset', body.email, () =>
      this.authService.resetPassword(body),
    );
  }
}
