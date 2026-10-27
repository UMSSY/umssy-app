import { Injectable } from '@nestjs/common';
import bcrypt from 'bcrypt';
import { ApprovedAccountActivationRepository } from '../repositories/approved-account-activation.repository.js';
import { ApprovedAccountActivationException } from '../exceptions/approved-account-activation.exception.js';
import type { ActivateApprovedAccountDto } from '../requests/activate-approved-account.schema.js';

@Injectable()
export class ApprovedAccountActivationService {
  constructor(
    private readonly repository: ApprovedAccountActivationRepository,
  ) {}

  async activate(requestId: string, input: ActivateApprovedAccountDto) {
    const password = await bcrypt.hash(input.password, 10);
    const result = await this.repository.withIdentityLock(async (tx) => {
      const otp = await this.repository.findApprovedOtp(tx, requestId);
      if (!otp || !otp.valid || otp.attempts >= 5) return false;
      const request = await this.repository.findRequest(tx, requestId);
      const matching = await bcrypt.compare(input.code, otp.codeHash);
      if (!matching) {
        await this.repository.recordFailedAttempt(tx, otp.id);
        return false;
      }
      const existing = await this.repository.findUser(tx, request.email);
      if (request.approvedUserId && request.approvedUserId !== existing?.id)
        return false;
      // Vincular una cuenta existente exige su contraseña actual; el OTP no la reemplaza.
      if (
        existing &&
        (!existing.isActive ||
          (existing.password &&
            !(await bcrypt.compare(input.password, existing.password))))
      ) {
        await this.repository.recordFailedAttempt(tx, otp.id);
        return false;
      }
      if (
        existing &&
        (await this.repository.findOtherApproval(tx, existing.id, requestId))
      )
        return false;
      const user =
        existing ?? (await this.repository.createUser(tx, request, password));
      if (existing && !existing.password)
        await this.repository.setPassword(tx, user.id, password);
      await this.repository.completeActivation(tx, requestId, otp.id, user.id);
      return true;
    });
    if (!result) throw new ApprovedAccountActivationException();
    return { activated: true };
  }
}
