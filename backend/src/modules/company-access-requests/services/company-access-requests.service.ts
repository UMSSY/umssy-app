import type { UploadedDocumentFile } from '../../access-requests/types/uploaded-file.types.js';
import type { Prisma } from '../../../prisma/client.js';
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
import { MailService } from '../../mail/services/mail.service.js';
import { loadMailTemplate } from '../../mail/helpers/load-mail-template.js';
import { buildFrontendUrl } from '../../access-requests/mail/helpers/frontend-url.js';
import { CompanyAccessRequestsRepository } from '../repositories/company-access-requests.repository.js';
import { CompanyDocumentOcrService } from './company-document-ocr.service.js';
import type {
  ActivateCompanyAccountDto,
  CreateCompanyAccessRequestDto,
  ListCompanyAccessRequestsQuery,
  RejectCompanyAccessRequestDto,
  RequestCorrectionDto,
  UpdateCompanyAccessRequestDto,
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
    private readonly companyOcr: CompanyDocumentOcrService,
    private readonly mailService: MailService,
  ) {}

  listCities() {
    return this.repository.listCities();
  }

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
    void this.evaluateLetterheadOcr(id);

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
    let current = await this.repository.findById(id);
    if (!current || current.status.title === 'DRAFT') {
      throw new NotFoundException('Solicitud de empresa no encontrada');
    }

    if (current.status.title === 'PENDING') {
      await this.repository.markInReview(id, reviewerId);
      current = await this.repository.findById(id);
      if (!current) {
        throw new NotFoundException('Solicitud de empresa no encontrada');
      }
    }

    if (current.documentFileId && !current.ocrFieldResults) {
      const analysis = await this.evaluateLetterheadOcr(id);
      if (analysis) {
        current.ocrMatchScore = analysis.matchScore;
        current.ocrFieldResults =
          analysis.fields as unknown as Prisma.JsonValue;
      }
    }

    return current;
  }

  async reEvaluateOcr(id: string) {
    const current = await this.repository.findById(id);
    if (!current) {
      throw new NotFoundException('Solicitud de empresa no encontrada');
    }
    if (!current.documentFileId) {
      throw new BadRequestException(
        'La solicitud no tiene documento adjunto para evaluar',
      );
    }

    const analysis = await this.evaluateLetterheadOcr(id);
    return {
      id,
      ocrMatchScore: analysis?.matchScore ?? 0,
      ocrFieldResults: analysis?.fields ?? null,
    };
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

    try {
      const activationUrl = buildFrontendUrl('/request-access/activation', {
        code: updated.requestCode ?? '',
        email: current.email,
      });
      const expiresInMinutes = '1440';
      await this.mailService.send({
        to: current.email,
        subject: 'Tu código de activación de UMSSY para empresa',
        text: `Tu solicitud de acceso para ${current.companyName} fue aprobada. Tu código de activación es ${rawCode} y vence en 24 horas. Actívalo en ${activationUrl}`,
        mjml: await loadMailTemplate('activation-code'),
        values: {
          code: rawCode,
          expiresInMinutes,
          activationUrl,
        },
      });
    } catch (mailError) {
      this.logger.warn(
        `No se pudo enviar el correo de activación a ${current.email}: ${
          mailError instanceof Error ? mailError.message : String(mailError)
        }`,
      );
    }

    return {
      id: updated.id,
      status: 'APPROVED',
      approvedCompanyId: updated.approvedCompanyId,
      activationCodeSent: true,
    };
  }

  async update(id: string, dto: UpdateCompanyAccessRequestDto) {
    const current = await this.repository.findById(id);
    if (!current) {
      throw new NotFoundException('Solicitud de empresa no encontrada');
    }
    if (current.status.title === 'APPROVED') {
      throw new BadRequestException(
        'No se puede modificar una solicitud que ya ha sido aprobada',
      );
    }

    await this.repository.updateData(id, dto);
    await this.evaluateLetterheadOcr(id);
    return this.repository.findById(id);
  }

  async requestCorrection(
    id: string,
    reviewerId: string,
    dto: RequestCorrectionDto,
  ) {
    const current = await this.repository.findById(id);
    if (!current || current.status.title === 'DRAFT') {
      throw new NotFoundException('Solicitud de empresa no encontrada');
    }
    if (current.status.title === 'APPROVED') {
      throw new BadRequestException(
        'La solicitud ya fue aprobada y no admite observaciones',
      );
    }

    const composedReason = `[${dto.reasonCategory}] ${dto.customDetails}`;
    const updated = await this.repository.observeCompanyRequest(
      id,
      reviewerId,
      composedReason,
    );

    try {
      const requestStatusUrl = buildFrontendUrl('/request-access/status', {
        code: current.requestCode ?? '',
        email: current.email,
      });
      await this.mailService.send({
        to: current.email,
        subject: 'Observaciones a tu solicitud de registro de empresa en UMSSY',
        text: `Tu solicitud de acceso para ${current.companyName} (${current.requestCode}) requiere subsanación.\n\nMotivo:\n${composedReason}\n\nConsulta el estado y realiza las correcciones en: ${requestStatusUrl}`,
        mjml: await loadMailTemplate('access-request-rejection'),
        values: {
          reason: composedReason,
          requestCode: current.requestCode ?? '',
          requestStatusUrl,
        },
      });
    } catch (mailError) {
      this.logger.warn(
        `No se pudo enviar el correo de subsanación a ${current.email}: ${
          mailError instanceof Error ? mailError.message : String(mailError)
        }`,
      );
    }

    return updated;
  }

  async reject(
    id: string,
    reviewerId: string,
    reasonOrDto: RejectCompanyAccessRequestDto | string,
  ) {
    const current = await this.repository.findById(id);
    if (!current || current.status.title === 'DRAFT') {
      throw new NotFoundException('Solicitud de empresa no encontrada');
    }
    if (
      current.status.title !== 'IN_REVIEW' &&
      current.status.title !== 'PENDING' &&
      current.status.title !== 'OBSERVED'
    ) {
      throw new BadRequestException(
        'La solicitud ya fue resuelta anteriormente',
      );
    }

    let finalReason: string;
    if (typeof reasonOrDto === 'string') {
      finalReason = reasonOrDto;
    } else if (reasonOrDto.reasonCategory && reasonOrDto.customDetails) {
      finalReason = `[${reasonOrDto.reasonCategory}] ${reasonOrDto.customDetails}`;
    } else {
      finalReason =
        reasonOrDto.reason ??
        reasonOrDto.customDetails ??
        'Solicitud no cumple con los requisitos institucionales.';
    }

    await this.repository.rejectCompanyRequest(id, reviewerId, finalReason);

    try {
      const requestStatusUrl = buildFrontendUrl('/request-access/status', {
        code: current.requestCode ?? '',
        email: current.email,
      });
      await this.mailService.send({
        to: current.email,
        subject: 'Dictamen de tu solicitud de registro de empresa en UMSSY',
        text: `Tu solicitud de acceso para ${current.companyName} (${current.requestCode}) fue rechazada.\n\nMotivo del rechazo:\n${finalReason}\n\nConsulta el estado en: ${requestStatusUrl}`,
        mjml: await loadMailTemplate('access-request-rejection'),
        values: {
          reason: finalReason,
          requestCode: current.requestCode ?? '',
          requestStatusUrl,
        },
      });
    } catch (mailError) {
      this.logger.warn(
        `No se pudo enviar el correo de rechazo a ${current.email}: ${
          mailError instanceof Error ? mailError.message : String(mailError)
        }`,
      );
    }

    return { id, status: 'REJECTED', rejectionReason: finalReason };
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
    if (!found || found.status.title !== 'APPROVED' || !found.approvedUserId) {
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

  async evaluateLetterheadOcr(requestId: string) {
    try {
      const current = await this.repository.findById(requestId);
      if (!current?.documentFileId) {
        return null;
      }

      const file = await this.filesService.getContent(current.documentFileId);
      const analysis = await this.companyOcr.analyze(
        file.content,
        file.mimeType,
        {
          companyName: current.companyName,
          city: current.city?.title ?? '',
          email: current.email,
          phone: current.phone,
          websiteUrl: current.websiteUrl,
          sector: current.sector,
        },
      );

      await this.repository.saveOcrResult(
        requestId,
        analysis.matchScore,
        analysis.fields as unknown as Prisma.InputJsonValue,
      );

      return analysis;
    } catch (error) {
      this.logger.warn(
        `No se pudo extraer o evaluar OCR de la carta de empresa ${requestId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return null;
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
