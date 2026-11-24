import { Injectable } from '@nestjs/common';
import { AccessRequestDetailsService } from '../../access-requests/services/access-request-details.service.js';
import { FileNotFoundException } from '../../files/exceptions/index.js';
import { FilesService } from '../../files/services/files.service.js';
import {
  AuditEventNotFoundException,
  AuditEvidenceNotFoundException,
  AuditEvidenceUnavailableException,
} from '../exceptions/index.js';
import { toAuditEventDetail } from '../mappers/audit-event-detail.mapper.js';
import {
  toAuditEventListItem,
  toAuditResponsibleOptions,
} from '../mappers/audit-event.mapper.js';
import { AuditEventsRepository } from '../repositories/audit-events.repository.js';
import type { ListAuditEventsQuery } from '../requests/list-audit-events.schema.js';

@Injectable()
export class AuditEventsService {
  constructor(
    private readonly auditEventsRepository: AuditEventsRepository,
    private readonly filesService: FilesService,
    private readonly accessRequestDetailsService: AccessRequestDetailsService,
  ) {}

  async list(query: ListAuditEventsQuery) {
    const { page, limit, ...filters } = query;
    const offset = (page - 1) * limit;
    const { rows, total } = await this.auditEventsRepository.findPage({
      filters,
      skip: offset,
      take: limit,
    });
    return {
      data: { items: rows.map(toAuditEventListItem), total, page, limit },
      page,
      offset,
    };
  }

  async listResponsibles() {
    return toAuditResponsibleOptions(
      await this.auditEventsRepository.findResponsibles(),
    );
  }

  async getDetail(id: string) {
    const event = await this.auditEventsRepository.findDetailById(id);
    if (!event) {
      throw new AuditEventNotFoundException();
    }
    const applicantDetails =
      await this.accessRequestDetailsService.getApplicantDetails(
        event.accessRequestId,
      );
    return toAuditEventDetail(event, applicantDetails);
  }

  // La evidencia sale de la referencia guardada en el evento, nunca del documento actual de la solicitud
  async getDocument(id: string) {
    const event = await this.auditEventsRepository.findEvidenceReference(id);
    if (!event) {
      throw new AuditEventNotFoundException();
    }
    if (!event.evidenceFileId) {
      throw new AuditEvidenceNotFoundException();
    }
    try {
      return await this.filesService.getContent(event.evidenceFileId);
    } catch (error) {
      if (error instanceof FileNotFoundException) {
        throw new AuditEvidenceUnavailableException();
      }
      throw error;
    }
  }
}
