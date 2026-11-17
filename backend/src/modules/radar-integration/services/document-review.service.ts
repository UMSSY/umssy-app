import { Injectable } from '@nestjs/common';
import { UsersService } from '../../users/services/users.service.js';
import { DocumentVerificationRepository } from '../repositories/document-verification.repository.js';
import { DocumentVerificationConflictException } from '../exceptions/document-verification-conflict.exception.js';
import { DocumentVerificationFileNotFoundException } from '../exceptions/document-verification-file-not-found.exception.js';
import type { DocumentReviewFilter } from '../types/document-review-filter.types.js';
@Injectable()
export class DocumentReviewService {
  constructor(
    private readonly store: DocumentVerificationRepository,
    private readonly users: UsersService,
  ) {}

  history(owner: string) {
    return this.store.history(owner);
  }

  async revise(admin: string, id: string, decision: 'reprocess' | 'revoke') {
    if (!(await this.store.revise(admin, id, decision))) {
      throw new DocumentVerificationConflictException();
    }
    return { id };
  }

  async acknowledge(owner: string, id: string, status: string) {
    if (!(await this.store.acknowledge(owner, id, status))) {
      throw new DocumentVerificationConflictException();
    }
    return { id };
  }

  async reviews(filter: DocumentReviewFilter) {
    const rows = await this.store.reviews(filter);
    const owners = await this.users.findNamesByIds([
      ...new Set(rows.map((row) => row.userId)),
    ]);

    const names = new Map(
      owners.map((owner) => [
        owner.id,
        `${owner.firstName} ${owner.lastName}`.trim(),
      ]),
    );

    return rows.map(({ userId, ...row }) => ({
      ...row,
      ownerName: names.get(userId) ?? 'Usuario no disponible',
    }));
  }

  async file(id: string, owner?: string) {
    const [row] = await this.store.file(id, owner);
    if (!row) {
      throw new DocumentVerificationFileNotFoundException();
    }
    return row;
  }
}
