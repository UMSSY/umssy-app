import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import {
  APPOINTMENT_DOCUMENT_FILE_SELECT,
  APPOINTMENT_DOCUMENT_METADATA_SELECT,
} from '../constants/appointment-document-select.constants.js';
import type { AppointmentDocumentFileRecord } from '../types/appointment-document-file-record.types.js';
import type { AppointmentDocumentMetadataRecord } from '../types/appointment-document-metadata-record.types.js';
import type { SaveAppointmentDocumentData } from '../types/save-appointment-document-data.types.js';

@Injectable()
export class AppointmentDocumentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  save(
    appointmentId: string,
    document: SaveAppointmentDocumentData,
  ): Promise<AppointmentDocumentMetadataRecord> {
    const data = { ...document, data: new Uint8Array(document.data) };

    return this.prisma.appointmentDocument.upsert({
      where: { appointmentId },
      create: { appointmentId, ...data },
      update: { ...data, uploadedAt: new Date() },
      select: APPOINTMENT_DOCUMENT_METADATA_SELECT,
    });
  }

  findFile(
    appointmentId: string,
  ): Promise<AppointmentDocumentFileRecord | null> {
    return this.prisma.appointmentDocument.findUnique({
      where: { appointmentId },
      select: APPOINTMENT_DOCUMENT_FILE_SELECT,
    });
  }
}
