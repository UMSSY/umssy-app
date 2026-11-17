import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { InvalidResetCodeException } from '../exceptions/invalid-reset-code.exception.js';
import { PasswordReusedException } from '../exceptions/password-reused.exception.js';
import { PasswordHistoryRepository } from '../repositories/password-history.repository.js';

@Injectable()
export class PasswordHistoryService {
  constructor(private readonly repository: PasswordHistoryRepository) {}

  async validateNewPassword(
    userId: string,
    candidate: string,
  ): Promise<string | null> {
    const snapshot = await this.repository.findSnapshot(userId);
    if (!snapshot) throw new InvalidResetCodeException();

    const hashes = snapshot.passwordHistories.map(
      ({ passwordHash }) => passwordHash,
    );
    if (snapshot.password !== null) hashes.unshift(snapshot.password);

    for (const hash of hashes) {
      if (await bcrypt.compare(candidate, hash)) {
        throw new PasswordReusedException();
      }
    }

    return snapshot.password;
  }
}

