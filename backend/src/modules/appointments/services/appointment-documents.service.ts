import { Injectable } from '@nestjs/common';
import { FileValidationService } from '../../../common/services/file-validation.service.js';
import type { MulterFile } from '../../../common/types/multer-file.type.js';
import {
  APPOINTMENT_DOCUMENT_OPEN_STATUSES,
  APPOINTMENT_DOCUMENT_VALIDATION_RULES,
} from '../constants/appointment-document.constants.js';
import {
  AppointmentClosedException,
  AppointmentDocumentNotFoundException,
  AppointmentDocumentUploadForbiddenException,
  AppointmentNotFoundException,
  AppointmentNotOwnedException,
} from '../exceptions/index.js';
import { AppointmentDocumentMapper } from '../mappers/appointment-document.mapper.js';
import { AppointmentDocumentsRepository } from '../repositories/appointment-documents.repository.js';
import { AppointmentsRepository } from '../repositories/appointments.repository.js';
import type { AppointmentDocumentDownload } from '../types/appointment-document-download.types.js';
import type { AppointmentDocumentResponse } from '../types/appointment-document-response.types.js';
import type { AppointmentRecord } from '../types/appointment-record.types.js';

@Injectable()
export class AppointmentDocumentsService {
  constructor(
    private readonly appointmentsRepository: AppointmentsRepository,
    private readonly documentsRepository: AppointmentDocumentsRepository,
    private readonly fileValidationService: FileValidationService,
    private readonly documentMapper: AppointmentDocumentMapper,
  ) {}

  async upload(
    userId: string,
    appointmentId: string,
    file: MulterFile | undefined,
  ): Promise<AppointmentDocumentResponse> {
    const appointment = await this.findParticipatedOrFail(
      userId,
      appointmentId,
    );

    if (appointment.studentId !== userId) {
      throw new AppointmentDocumentUploadForbiddenException();
    }
    if (!this.isOpen(appointment)) {
      throw new AppointmentClosedException();
    }

    const validatedFile = this.fileValidationService.validate(
      file ? this.documentMapper.toUploadedFile(file) : undefined,
      APPOINTMENT_DOCUMENT_VALIDATION_RULES,
    );
    const saved = await this.documentsRepository.save(
      appointmentId,
      this.documentMapper.toSaveData(validatedFile),
    );

    return this.documentMapper.toResponse(saved);
  }

  async download(
    userId: string,
    appointmentId: string,
  ): Promise<AppointmentDocumentDownload> {
    await this.findParticipatedOrFail(userId, appointmentId);
    const document = await this.documentsRepository.findFile(appointmentId);

    if (!document) {
      throw new AppointmentDocumentNotFoundException();
    }

    return this.documentMapper.toDownload(document);
  }

  private async findParticipatedOrFail(
    userId: string,
    appointmentId: string,
  ): Promise<AppointmentRecord> {
    const appointment =
      await this.appointmentsRepository.findById(appointmentId);

    if (!appointment) {
      throw new AppointmentNotFoundException();
    }
    if (appointment.mentorId !== userId && appointment.studentId !== userId) {
      throw new AppointmentNotOwnedException();
    }

    return appointment;
  }

  private isOpen(appointment: AppointmentRecord): boolean {
    return (
      APPOINTMENT_DOCUMENT_OPEN_STATUSES.includes(appointment.status.title) &&
      appointment.endAt.getTime() > Date.now()
    );
  }
}
