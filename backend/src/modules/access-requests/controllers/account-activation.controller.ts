import { Body, Controller, Get, HttpCode, Post, Query } from '@nestjs/common';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe.js';
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
  constructor(private readonly accountActivationService: AccountActivationService) {}

  @Get('status')
  getStatus(@Query(new ZodValidationPipe(activationStatusQuerySchema)) query: ActivationStatusQuery) {
    return this.accountActivationService.getStatus(query.email);
  }

  @Post('verify')
  @HttpCode(200)
  verify(@Body(new ZodValidationPipe(verifyActivationCodeSchema)) body: VerifyActivationCodeDto) {
    return this.accountActivationService.verify(body.email, body.code);
  }

  @Post()
  @HttpCode(200)
  activate(@Body(new ZodValidationPipe(activateAccountSchema)) body: ActivateAccountDto) {
    return this.accountActivationService.activate(body.email, body.code, body.password);
  }

  @Post('resend')
  @HttpCode(200)
  resend(@Body(new ZodValidationPipe(resendActivationCodeSchema)) body: ResendActivationCodeDto) {
    return this.accountActivationService.resend(body.email);
  }
}