import { RequestValidationException } from '../../../common/exceptions/request-validation.exception.js';
import { ForbiddenRoleException } from '../../../common/exceptions/forbidden-role.exception.js';
import { ProposalKeyConflictException } from '../exceptions/proposal-key-conflict.exception.js';
import { ProposalCoverNotFoundException } from '../exceptions/proposal-cover-not-found.exception.js';
import { Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { EventProposalsRepository } from '../repositories/event-proposals.repository.js';
import { mapCreatedProposal, mapProposalCover } from '../mappers/event-proposal.mapper.js';
import { FileValidationService } from '../../../common/services/file-validation.service.js';
import type { MulterFile } from '../../../common/types/multer-file.type.js';
import { CreateProposalSchema } from '../requests/create-proposal.request.js';
import type { Event } from '../../../prisma/client.js';

@Injectable()
export class EventProposalsService {
  constructor(private readonly repository: EventProposalsRepository, private readonly files: FileValidationService) {}

  async create(userId: string, body: unknown, file: MulterFile | undefined, key: string | undefined) {
    if (!key || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(key)) throw new RequestValidationException([{ field: 'idempotencyKey', message: 'Se requiere una clave de idempotencia UUID.' }]);
    const parsed = CreateProposalSchema.safeParse(body);
    if (!parsed.success) throw new RequestValidationException(parsed.error.issues.map((issue) => ({ field: issue.path.join('.') || 'body', message: issue.message })));
    const values = parsed.data;
    const cover = this.files.validate(file ? { originalName: file.originalname, mimeType: file.mimetype, size: file.size, buffer: file.buffer } : undefined, { allowedTypes: ['jpg', 'png'], maxSizeBytes: 5 * 1024 * 1024 });
    const hash = createHash('sha256').update(JSON.stringify(values)).update(cover.buffer).digest('hex');
    const existing = await this.repository.findByKey(userId, key);
    if (existing) return this.replay(existing, hash);
    try {
      return await this.repository.transaction(async (tx) => {
        const author = await this.repository.findAuthor(tx, userId);
        if (!author) throw new ForbiddenRoleException('Solo un titulado activo puede proponer talleres.');
        if (!await this.repository.findCategory(tx, values.categoryId)) throw new RequestValidationException([{ field: 'categoryId', message: 'Selecciona una categoría disponible.' }]);
        const title = values.modality === 'virtual' ? 'Virtual' : 'Presencial';
        const catalogs = await this.repository.ensureCatalogs(tx, title);
        const event = await this.repository.create(tx, {
          title: values.title, description: values.description, categoryId: values.categoryId,
          eventDate: new Date(values.eventDate + 'T00:00:00Z'),
          startTime: new Date('1970-01-01T' + values.startTime + ':00Z'), endTime: new Date('1970-01-01T' + values.endTime + ':00Z'),
          capacity: values.capacity, location: values.location, ...catalogs,
          createdById: userId, instructorName: (author.firstName + ' ' + author.lastName).trim(),
          supportThreshold: Math.max(8, Math.ceil(values.capacity / 2)), votingDeadline: new Date(Date.now() + 10 * 86400000),
          coverData: new Uint8Array(cover.buffer), coverMimeType: cover.detectedMimeType, proposalKey: key, proposalHash: hash,
        });
        return mapCreatedProposal(event);
      });
    } catch (error) {
      // A concurrent retry can win the unique constraint. Return its committed result.
      if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') {
        const winner = await this.repository.findByKey(userId, key);
        if (winner) return this.replay(winner, hash);
      }
      throw error;
    }
  }
  async cover(id: string) {
    const event = await this.repository.findCover(id);
    if (!event?.coverData || !event.coverMimeType) throw new ProposalCoverNotFoundException();
    return mapProposalCover(event.coverData, event.coverMimeType);
  }
  private replay(event: Event, hash: string) {
    if (event.proposalHash !== hash) throw new ProposalKeyConflictException();
    return mapCreatedProposal(event);
  }
}
