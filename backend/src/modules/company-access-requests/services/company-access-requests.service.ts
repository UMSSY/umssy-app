import type { UploadedDocumentFile } from '../../access-requests/types/uploaded-file.types.js';
import { createHash, randomInt } from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { FilesService } from '../../files/services/files.service.js';
import { DocumentTextExtractorService } from '../../access-requests/services/document-text-extractor.service.js';
import { CompanyAccessRequestsRepository } from '../repositories/company-access-requests.repository.js';
import type {
  ActivateCompanyAccountDto,
  CreateCompanyAccessRequestDto,
  ListCompanyAccessRequestsQuery,
} from '../requests/create-company-access-request.schema.js';

const ALLOWED_LOGO_MIMES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/svg+xml',
]);

@Injectable()
export class CompanyAccessRequestsService {
  private readonly logger = new Logger(CompanyAccessRequestsService.name);

  constructor(
    private readonly repository: CompanyAccessRequestsRepository,
    private readonly filesService: FilesService,
    private readonly textExtractor: DocumentTextExtractorService,
  ) {}

  async create(dto: CreateCompanyAccessRequestDto) {
    const { existingCompany, existingUser, activeRequest } =
      await this.repository.findDuplicates(dto.companyName, dto.email);

    if (existingCompany) {
      throw new ConflictException('Esta empresa ya se encuentra registrada');
    }
    if (existingUser) {
      throw new ConflictException(
        'El correo electrónico ya pertenece a una cuenta registrada',
      );
    }
    if (activeRequest) {
      throw new ConflictException(
        'Ya existe una solicitud activa o aprobada para esta empresa o correo',
      );
    }

    const draft = await this.repository.createDraft(dto);
    return { id: draft.id };
  }

  async attachLogo(id: string, file: UploadedDocumentFile | undefined) {
    const current = await this.findEditableDraft(id);
    if (!file) {
      throw new BadRequestException('Debes adjuntar un archivo de imagen');
    }
    if (!ALLOWED_LOGO_MIMES.has(file.mimetype)) {
      throw new BadRequestException(
        'El logo debe estar en formato PNG, JPG, WEBP o SVG',
      );
    }

    const created = await this.filesService.create({
      name: Buffer.from(file.originalname, 'latin1').toString('utf8'),
      content: file.buffer,
    });

    const previousId = await this.repository.setLogo(id, created.id);
    if (previousId && previousId !== created.id) {
      await this.safeDeleteFile(previousId);
    }

    return { id: current.id, logoFileId: created.id };
  }

  async attachDocument(id: string, file: UploadedDocumentFile | undefined) {
    const current = await this.findEditableDraft(id);
    if (!file) {
      throw new BadRequestException(
        'Debes adjuntar la carta de solicitud en hoja membretada',
      );
    }

    const created = await this.filesService.create({
      name: Buffer.from(file.originalname, 'latin1').toString('utf8'),
      content: file.buffer,
    });

    const previousId = await this.repository.setDocument(id, created.id);
    if (previousId && previousId !== created.id) {
      await this.safeDeleteFile(previousId);
    }

    return { id: current.id, documentFileId: created.id };
  }

  async submit(id: string) {
    const current = await this.findEditableDraft(id);
    if (!current.documentFileId) {
      throw new BadRequestException(
        'Debes adjuntar la carta de solicitud antes de enviar',
      );
    }

    const submitted = await this.repository.submitWithGeneratedCode(id);
    void this.evaluateLetterheadOcr(id, current.companyName, current.documentFileId);

    return {
      id: submitted.id,
      requestCode: submitted.requestCode,
      status: submitted.status.title,
      submittedAt: submitted.submittedAt?.toISOString() ?? null,
    };
  }

  list(query: ListCompanyAccessRequestsQuery) {
    return this.repository.findPage(query);
  }

  getSummary() {
    return this.repository.getSummary();
  }

  async getDetail(id: string, reviewerId: string) {
    const current = await this.repository.findById(id);
    if (!current || current.status.title === 'DRAFT') {
      throw new NotFoundException('Solicitud de empresa no encontrada');
    }

    if (current.status.title === 'PENDING') {
      await this.repository.markInReview(id, reviewerId);
      return this.repository.findById(id);
    }

    return current;
  }

  async getDocument(id: string) {
    const current = await this.repository.findById(id);
    if (!current?.documentFileId) {
      throw new NotFoundException('Documento de solicitud no encontrado');
    }
    return this.filesService.getContent(current.documentFileId);
  }

  async getLogo(id: string) {
    const current = await this.repository.findById(id);
    if (!current) {
      throw new NotFoundException('Solicitud de empresa no encontrada');
    }

    if (current.logoFileId) {
      return this.filesService.getContent(current.logoFileId);
    }

    if (current.approvedCompanyId) {
      const logo = await this.repository.findCompanyLogo(
        current.approvedCompanyId,
      );
      if (logo) {
        return {
          name: logo.fileName,
          mimeType: logo.mimeType,
          content: Buffer.from(logo.data),
        };
      }
    }

    throw new NotFoundException('La empresa no adjuntó un logo');
  }

  async getPublicCompanyLogo(companyId: string) {
    const logo = await this.repository.findCompanyLogo(companyId);
    if (!logo) {
      throw new NotFoundException('Logo de empresa no encontrado');
    }
    return {
      name: logo.fileName,
      mimeType: logo.mimeType,
      content: Buffer.from(logo.data),
    };
  }

  async approve(id: string, reviewerId: string) {
    const current = await this.repository.findById(id);
    if (!current || current.status.title === 'DRAFT') {
      throw new NotFoundException('Solicitud de empresa no encontrada');
    }
    if (
      current.status.title !== 'IN_REVIEW' &&
      current.status.title !== 'PENDING'
    ) {
      throw new BadRequestException(
        'La solicitud ya fue resuelta anteriormente',
      );
    }

    const rawCode = String(randomInt(100000, 999999));
    const codeHash = createHash('sha256').update(rawCode).digest('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const updated = await this.repository.approveCompanyRequest(
      id,
      reviewerId,
      codeHash,
      expiresAt,
    );

    this.logger.log(
      `[OTP EMPRESA] Código de activación para ${current.email} (${updated.requestCode}): ${rawCode}`,
    );

    return {
      id: updated.id,
      status: 'APPROVED',
      approvedCompanyId: updated.approvedCompanyId,
      activationCodeSent: true,
    };
  }

  async reject(id: string, reviewerId: string, reason: string) {
    const current = await this.repository.findById(id);
    if (!current || current.status.title === 'DRAFT') {
      throw new NotFoundException('Solicitud de empresa no encontrada');
    }
    if (
      current.status.title !== 'IN_REVIEW' &&
      current.status.title !== 'PENDING'
    ) {
      throw new BadRequestException(
        'La solicitud ya fue resuelta anteriormente',
      );
    }

    await this.repository.rejectCompanyRequest(id, reviewerId, reason);
    return { id, status: 'REJECTED', rejectionReason: reason };
  }

  async getStatus(code: string, email: string) {
    const found = await this.repository.findByCodeAndEmail(code, email);
    if (!found) {
      throw new NotFoundException(
        'No se encontró una solicitud con ese código y correo',
      );
    }
    return {
      requestCode: found.requestCode,
      companyName: found.companyName,
      status: found.status.title,
      submittedAt: found.submittedAt?.toISOString() ?? null,
      reviewedAt: found.reviewedAt?.toISOString() ?? null,
      rejectionReason:
        found.status.title === 'REJECTED' ? found.rejectionReason : null,
    };
  }

  async activate(dto: ActivateCompanyAccountDto) {
    const found = await this.repository.findByCodeAndEmail(
      dto.requestCode,
      dto.email,
    );
    if (
      !found ||
      found.status.title !== 'APPROVED' ||
      !found.approvedUserId
    ) {
      throw new BadRequestException('Solicitud no válida para activación');
    }

    const otp = found.activationOtps[0];
    if (!otp || otp.expiresAt < new Date()) {
      throw new BadRequestException(
        'El código de activación ha expirado o no existe',
      );
    }

    const inputHash = createHash('sha256').update(dto.code).digest('hex');
    if (inputHash !== otp.codeHash) {
      throw new BadRequestException('El código de activación es incorrecto');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    return this.repository.activateRecruiterAccount(
      found.id,
      otp.id,
      found.approvedUserId,
      passwordHash,
    );
  }

  private async evaluateLetterheadOcr(
    requestId: string,
    companyName: string,
    documentFileId: string,
  ) {
    try {
      const file = await this.filesService.getContent(documentFileId);
      const extracted = await this.textExtractor.extract(file);
      const normalized = extracted.text
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();

      const cleanCompany = companyName
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();

      const hasCompanyName = normalized.includes(cleanCompany);
      const hasUniversityRef =
        normalized.includes('sistemas') ||
        normalized.includes('informatica') ||
        normalized.includes('umss') ||
        normalized.includes('san simon');
      const hasRequestIntent =
        normalized.includes('solicitud') ||
        normalized.includes('acceso') ||
        normalized.includes('plataforma');

      const score =
        (hasCompanyName ? 50 : 0) +
        (hasUniversityRef ? 30 : 0) +
        (hasRequestIntent ? 20 : 0);

      await this.repository.saveOcrResult(requestId, score, {
        companyNameMatched: hasCompanyName,
        departmentMatched: hasUniversityRef,
        requestIntentMatched: hasRequestIntent,
      });
    } catch (error) {
      this.logger.warn(
        `No se pudo extraer texto OCR de la carta de empresa ${requestId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  private async findEditableDraft(id: string) {
    const current = await this.repository.findById(id);
    if (!current) {
      throw new NotFoundException('Solicitud de empresa no encontrada');
    }
    if (current.status.title !== 'DRAFT') {
      throw new BadRequestException(
        'La solicitud ya fue enviada y no admite cambios',
      );
    }
    return current;
  }

  private async safeDeleteFile(fileId: string) {
    try {
      await this.filesService.delete(fileId);
    } catch {}
  }
}