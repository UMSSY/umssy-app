import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Optional,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe.js';
import { AuthSessionCookieService } from '../../auth/services/auth-session-cookie.service.js';
import {
  activateAccountSchema,
  activationStatusQuerySchema,
  resendActivationCodeSchema,
  verifyActivationCodeSchema,
  type ActivateAccountDto,
  type ActivationStatusQuery,
  type ResendActivationCodeDto,
  type VerifyActivationCodeDto,
} from '../requests/activation.schema.js';
import { AccountActivationService } from '../services/account-activation.service.js';

// Rutas públicas: quien activa su cuenta todavía no tiene sesión
@Controller('account-activation')
export class AccountActivationController {
  constructor(
    private readonly accountActivationService: AccountActivationService,
    @Optional()
    private readonly sessionCookies?: AuthSessionCookieService,
  ) {}

  @Get('status')
  getStatus(
    @Query(new ZodValidationPipe(activationStatusQuerySchema))
    query: ActivationStatusQuery,
  ) {
    return this.accountActivationService.getStatus(query.email);
  }

  @Post('verify')
  @HttpCode(200)
  verify(
    @Body(new ZodValidationPipe(verifyActivationCodeSchema))
    body: VerifyActivationCodeDto,
  ) {
    return this.accountActivationService.verify(body.email, body.code);
  }

  @Post()
  @HttpCode(200)
  async activate(
    @Body(new ZodValidationPipe(activateAccountSchema))
    body: ActivateAccountDto,
    @Res({ passthrough: true }) response?: Response,
    @Headers('user-agent') userAgent?: string,
  ) {
    const result = await this.accountActivationService.activate(
      body.email,
      body.code,
      body.password,
    );
    if (response && this.sessionCookies) {
      const accessToken = await this.sessionCookies.issueLoginCookies(
        response,
        result.accessToken,
        userAgent,
      );
      return { ...result, accessToken };
    }
    return result;
  }

  @Post('resend')
  @HttpCode(200)
  resend(
    @Body(new ZodValidationPipe(resendActivationCodeSchema))
    body: ResendActivationCodeDto,
  ) {
    return this.accountActivationService.resend(body.email);
  }
}
