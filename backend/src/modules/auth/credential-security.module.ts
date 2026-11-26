import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { CREDENTIAL_LIMITS } from './constants/credential-limits.constants.js';
import { CredentialLimitsService } from './services/credential-limits.service.js';
import { CredentialSerialService } from './services/credential-serial.service.js';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: CREDENTIAL_LIMITS.windowMs,
        limit: CREDENTIAL_LIMITS.failures,
      },
    ]),
  ],
  providers: [CredentialLimitsService, CredentialSerialService],
  exports: [CredentialLimitsService],
})
export class CredentialSecurityModule {}
