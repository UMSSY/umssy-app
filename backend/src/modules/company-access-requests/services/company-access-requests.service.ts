import type { UploadedDocumentFile } from '../../access-requests/types/uploaded-file.types.js';
import type { NotifyRequest } from '../../notifications/types/notify-request.type.js';
import type { Prisma } from '../../../prisma/client.js';
import { createHash, randomInt } from 'node:crypto';
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { CompanyRegistrationConflictException } from '../exceptions/company-registration-conflict.exception.js';
import { FilesService } from '../../files/services/files.service.js';
import { buildFrontendUrl } from '../../mail/helpers/frontend-url.js';
import { NotificationsService } from '../../notifications/services/notifications.service.js';
import {
  companyRequestApprovedNotification,
  companyRequestObservedNotification,
  companyRequestRejectedNotification,
} from '../notification/company-request-notifications.js';
import { CompanyAccessRequestsRepository } from '../repositories/company-access-requests.repository.js';
import { CompanyDocumentOcrService } from './company-document-ocr.service.js';
import type {
  ActivateCompanyAccountDto,
  CreateCompanyAccessRequestDto,
  ListCompanyAccessRequestsQuery,
  RejectCompanyAccessRequestDto,
  ReportInconsistencyDto,
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
    private readonly notificationsService: NotificationsService,
  ) {}

  listCities() {
    return this.repository.listCities();
  }

  async create(dto: CreateCompanyAccessRequestDto) {
    const { existingCompany, existingUser, activeRequest } =
      await this.repository.findDuplicates(dto.companyName, dto.email);

    if (existingCompany) {
      throw new CompanyRegistrationConflictException(
        `La empresa "${dto.companyName}" ya se encuentra registrada en la plataforma.`,
        'companyName',
      );
    }
    if (existingUser) {
      throw new CompanyRegistrationConflictException(
        `El correo electrónico "${dto.email}" ya pertenece a una cuenta registrada en la plataforma.`,
        'email',
      );
    }
    if (activeRequest) {
      throw new CompanyRegistrationConflictException(
        `Ya existe una solicitud activa o en revisión para "${activeRequest.companyName}" con el correo "${activeRequest.email}".`,
        'activeRequest',
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
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

    const updated = await this.repository.approveCompanyRequest(
      id,
      reviewerId,
      codeHash,
      expiresAt,
    );

    this.logger.log(
      `[OTP EMPRESA] Código de activación para ${current.email} (${updated.requestCode}): ${rawCode}`,
    );

    const expiresInMinutes = '2880';
    const activationUrl = buildFrontendUrl(
      '/request-access/activacion-empresa',
      {
        email: current.email,
        otp: rawCode,
      },
    );
    await this.dispatchDecisionNotification('activación', current.email, {
      recipientIds: updated.approvedUserId ? [updated.approvedUserId] : [],
      recipientEmails: updated.approvedUserId ? undefined : [current.email],
      actorId: reviewerId,
      ...companyRequestApprovedNotification({
        companyName: current.companyName,
        requestCode: updated.requestCode ?? '',
        activationCode: rawCode,
        expiresInMinutes,
        activationUrl,
      }),
      actionUrl: `/request-access/activacion-empresa?email=${encodeURIComponent(current.email)}&otp=${encodeURIComponent(rawCode)}`,
      channels: updated.approvedUserId ? ['IN_APP', 'EMAIL'] : ['EMAIL'],
    });

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

    const requestStatusUrl = buildFrontendUrl('/request-access/status', {
      code: current.requestCode ?? '',
      email: current.email,
    });
    await this.dispatchDecisionNotification('subsanación', current.email, {
      recipientIds: [],
      recipientEmails: [current.email],
      actorId: reviewerId,
      ...companyRequestObservedNotification({
        companyName: current.companyName,
        requestCode: current.requestCode ?? '',
        reason: composedReason,
        requestStatusUrl,
      }),
      actionUrl: `/request-access/status?code=${encodeURIComponent(current.requestCode ?? '')}&email=${encodeURIComponent(current.email)}`,
      channels: ['EMAIL'],
    });

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

    const requestStatusUrl = buildFrontendUrl('/request-access/status', {
      code: current.requestCode ?? '',
      email: current.email,
    });
    await this.dispatchDecisionNotification('rechazo', current.email, {
      recipientIds: [],
      recipientEmails: [current.email],
      actorId: reviewerId,
      ...companyRequestRejectedNotification({
        companyName: current.companyName,
        requestCode: current.requestCode ?? '',
        reason: finalReason,
        requestStatusUrl,
      }),
      actionUrl: `/request-access/status?code=${encodeURIComponent(current.requestCode ?? '')}&email=${encodeURIComponent(current.email)}`,
      channels: ['EMAIL'],
    });

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

  async getActivationStatus(email: string, code?: string, otp?: string) {
    if (!email || !email.trim()) {
      return {
        state: 'INVALID',
        message:
          'Enlace incompleto o no válido. Debe ingresar mediante el enlace oficial enviado a su correo electrónico.',
      };
    }

    const current = await this.repository.findByEmailForActivation(email);
    if (!current) {
      return {
        state: 'NOT_FOUND',
        message:
          'No se encontró ninguna solicitud de empresa asociada a este correo electrónico.',
      };
    }

    if (current.status.title === 'REJECTED') {
      return {
        state: 'REJECTED',
        message:
          'La solicitud de registro de empresa fue rechazada por la administración institucional.',
      };
    }

    if (current.status.title === 'OBSERVED') {
      return {
        state: 'OBSERVED',
        message:
          'La solicitud de empresa requiere subsanación antes de proceder a la activación.',
      };
    }

    if (current.status.title !== 'APPROVED') {
      return {
        state: 'PENDING',
        message:
          'La solicitud de empresa aún se encuentra en revisión institucional.',
      };
    }

    const isUserActive = current.approvedUser?.isActive === true;
    const latestOtp = current.activationOtps[0];
    const isOtpUsed = latestOtp ? latestOtp.usedAt !== null : false;

    if (isUserActive || isOtpUsed) {
      return {
        state: 'ALREADY_ACTIVATED',
        message:
          'Esta cuenta institucional ya ha sido registrada y activada con éxito anteriormente. Por motivos de seguridad, no se permite volver a registrarla ni modificar sus credenciales.',
      };
    }

    if (!latestOtp || latestOtp.expiresAt < new Date()) {
      return {
        state: 'EXPIRED',
        message:
          'El enlace o código de activación ha expirado (plazo de 24 horas vencido). Por favor comuníquese con soporte institucional para solicitar una nueva activación.',
      };
    }

    if (!code || !code.trim()) {
      return {
        state: 'REQUIRES_CODE',
        email: current.email,
        message: 'Ingrese su código de seguimiento para validar su identidad.',
      };
    }

    if (
      code.trim().toUpperCase() !== current.requestCode?.trim().toUpperCase()
    ) {
      return {
        state: 'INVALID_CODE',
        email: current.email,
        message:
          'El código de seguimiento ingresado no coincide con la solicitud registrada.',
      };
    }

    return {
      state: 'READY',
      email: current.email,
      data: {
        requestCode: current.requestCode,
        companyName: current.companyName,
        city: current.city?.title ?? 'Cochabamba',
        sector: current.sector,
        email: current.email,
        phone: current.phone,
        websiteUrl: current.websiteUrl,
        description: current.description,
        username: current.username,
      },
    };
  }

  async reportInconsistency(dto: ReportInconsistencyDto) {
    const updated = await this.repository.recordInconsistencyReport(
      dto.requestCode,
      dto.email,
      dto.observation,
    );
    if (!updated) {
      throw new NotFoundException('Solicitud no encontrada');
    }
    this.logger.log(
      `[INCONSISTENCIA REPORTADA] ${dto.requestCode} (${dto.email}): ${dto.observation}`,
    );
    return {
      reported: true,
      message:
        'Reporte de inconsistencia registrado formalmente para revisión administrativa.',
    };
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

  private async dispatchDecisionNotification(
    label: string,
    email: string,
    request: NotifyRequest,
  ) {
    try {
      await this.notificationsService.notify(request);
    } catch (notificationError) {
      this.logger.warn(
        `No se pudo enviar la notificación de ${label} a ${email}: ${
          notificationError instanceof Error
            ? notificationError.message
            : String(notificationError)
        }`,
      );
    }
  }

  private async safeDeleteFile(fileId: string) {
    try {
      await this.filesService.delete(fileId);
    } catch {}
  }
}
