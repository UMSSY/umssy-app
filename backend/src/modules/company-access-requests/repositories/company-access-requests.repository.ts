import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../prisma/client.js';
import { RECORD_NOT_FOUND_CODE } from '../../../common/constants/prisma-errors.constants.js';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import { COMPANY_CORRECTION_STATUSES } from '../constants/company-document-correction.constants.js';
import { COMPANY_DOCUMENT_CORRECTION_SELECT } from '../constants/company-document-correction-select.constants.js';
import { CompanyDocumentCorrectionConflictException } from '../exceptions/company-document-correction-conflict.exception.js';
import type {
  CompanyDocumentCorrectionResponse,
  ReplaceCompanyDocumentOperation,
} from '../types/company-document-correction.types.js';
import { NAME_BLOCKING_REQUEST_STATUSES, COMPANY_ROLE_NAME } from '../constants/registration-name-uniqueness.constants.js';
import { normalizeRegistrationName } from '../utils/normalize-registration-name.js';
import type {
  CreateCompanyAccessRequestDto,
  ListCompanyAccessRequestsQuery,
} from '../requests/create-company-access-request.schema.js';

const NO_EXCLUDED_REQUEST_ID = '00000000-0000-0000-0000-000000000000';

@Injectable()
export class CompanyAccessRequestsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listCities() {
    const defaultCities = [
      'Cochabamba',
      'La Paz',
      'Santa Cruz de la Sierra',
      'Sucre',
      'Oruro',
      'Potosí',
      'Tarija',
      'Trinidad',
      'Cobija',
      'El Alto',
      'Sacaba',
      'Quillacollo',
    ];

    let cities = await this.prisma.city.findMany({
      where: { NOT: { title: { startsWith: 'Seed:' } } },
      orderBy: { title: 'asc' },
      select: { id: true, title: true },
    });

    if (cities.length === 0) {
      await this.prisma.city.createMany({
        data: defaultCities.map((title) => ({ title })),
        skipDuplicates: true,
      });
      cities = await this.prisma.city.findMany({
        where: { NOT: { title: { startsWith: 'Seed:' } } },
        orderBy: { title: 'asc' },
        select: { id: true, title: true },
      });
    }

    return cities.map((city) => ({
      id: city.id,
      name: city.title,
    }));
  }

  async createDraft(dto: CreateCompanyAccessRequestDto) {
    const draftStatus = await this.prisma.accessRequestStatus.upsert({
      where: { title: 'DRAFT' },
      update: {},
      create: { title: 'DRAFT' },
    });

    return this.prisma.companyAccessRequest.create({
      data: {
        ...dto,
        statusId: draftStatus.id,
      },
    });
  }

  async findDuplicates(
    companyName: string,
    email: string,
    username: string,
    excludeRequestId: string = NO_EXCLUDED_REQUEST_ID,
  ) {
    const normalizedCompanyName = normalizeRegistrationName(companyName);
    const normalizedUsername = normalizeRegistrationName(username);
    const blockingStatuses = [...NAME_BLOCKING_REQUEST_STATUSES];

    const [companies, existingUser, requests, usernames] = await Promise.all([
      this.prisma.$queryRaw<Array<{ id: string }>>`
        SELECT c.id
        FROM companies c
        WHERE lower(btrim(regexp_replace(c.title, '\\s+', ' ', 'g'))) = ${normalizedCompanyName}
        LIMIT 1`,
      this.prisma.user.findUnique({
        where: { email },
        select: { id: true },
      }),
      this.prisma.$queryRaw<Array<{ companyName: string; email: string }>>`
        SELECT r.company_name AS "companyName", r.email
        FROM company_access_requests r
        JOIN access_request_statuses s ON s.id = r.status_id
        WHERE s.title = ANY(${blockingStatuses}::text[])
          AND (
            lower(btrim(regexp_replace(r.company_name, '\\s+', ' ', 'g'))) = ${normalizedCompanyName}
            OR r.email = ${email}
          )
          AND r.id <> ${excludeRequestId}::uuid
        LIMIT 1`,
      this.prisma.$queryRaw<Array<{ source: string }>>`
        SELECT 'user' AS source
        FROM users u
        JOIN user_roles ur ON ur.user_id = u.id AND ur.deleted_at IS NULL
        JOIN roles ro ON ro.id = ur.role_id AND ro.name = ${COMPANY_ROLE_NAME}
        WHERE lower(btrim(regexp_replace(u.first_name, '\\s+', ' ', 'g'))) = ${normalizedUsername}
        UNION ALL
        SELECT 'request' AS source
        FROM company_access_requests r
        JOIN access_request_statuses s ON s.id = r.status_id
        WHERE s.title = ANY(${blockingStatuses}::text[])
          AND r.id <> ${excludeRequestId}::uuid
          AND lower(btrim(regexp_replace(r.username, '\\s+', ' ', 'g'))) = ${normalizedUsername}
        LIMIT 1`,
    ]);

    return {
      existingCompany: companies[0] ?? null,
      existingUser,
      activeRequest: requests[0] ?? null,
      existingUsername: usernames[0] ?? null,
    };
  }

  findById(id: string) {
    return this.prisma.companyAccessRequest.findUnique({
      where: { id },
      include: {
        status: true,
        city: true,
        documentFile: true,
        logoFile: true,
        openedBy: { select: { id: true, firstName: true, lastName: true } },
        reviewedBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async setLogo(id: string, logoFileId: string) {
    const current = await this.prisma.companyAccessRequest.findUnique({
      where: { id },
      select: { logoFileId: true },
    });
    await this.prisma.companyAccessRequest.update({
      where: { id },
      data: { logoFileId },
    });
    return current?.logoFileId ?? null;
  }

  async setDocument(id: string, documentFileId: string) {
    const current = await this.prisma.companyAccessRequest.findUnique({
      where: { id },
      select: { documentFileId: true },
    });
    await this.prisma.companyAccessRequest.update({
      where: { id },
      data: { documentFileId },
    });
    return current?.documentFileId ?? null;
  }

  async submitWithGeneratedCode(id: string) {
    const pendingStatus = await this.prisma.accessRequestStatus.upsert({
      where: { title: 'PENDING' },
      update: {},
      create: { title: 'PENDING' },
    });
    const year = new Date().getFullYear();
    const latest = await this.prisma.companyAccessRequest.findFirst({
      where: { requestCode: { startsWith: `EMP-${year}-` } },
      orderBy: { requestCode: 'desc' },
      select: { requestCode: true },
    });
    let nextSeq = 1;
    if (latest?.requestCode) {
      const parts = latest.requestCode.split('-');
      const num = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(num)) nextSeq = num + 1;
    }
    const requestCode = `EMP-${year}-${String(nextSeq).padStart(4, '0')}`;

    return this.prisma.companyAccessRequest.update({
      where: { id },
      data: {
        requestCode,
        statusId: pendingStatus.id,
        submittedAt: new Date(),
      },
      include: { status: true },
    });
  }

  saveOcrResult(
    id: string,
    ocrMatchScore: number,
    ocrFieldResults: Prisma.InputJsonValue,
  ) {
    return this.prisma.companyAccessRequest.update({
      where: { id },
      data: { ocrMatchScore, ocrFieldResults },
    });
  }

  async markInReview(id: string, reviewerId: string) {
    const inReviewStatus = await this.prisma.accessRequestStatus.upsert({
      where: { title: 'IN_REVIEW' },
      update: {},
      create: { title: 'IN_REVIEW' },
    });
    return this.prisma.companyAccessRequest.update({
      where: { id },
      data: {
        statusId: inReviewStatus.id,
        openedById: reviewerId,
        openedAt: new Date(),
      },
    });
  }

  async findPage(query: ListCompanyAccessRequestsQuery) {
    const where: Prisma.CompanyAccessRequestWhereInput = {
      status:
        query.status === 'ALL'
          ? { title: { not: 'DRAFT' } }
          : { title: query.status },
      ...(query.search
        ? {
            OR: [
              { companyName: { contains: query.search, mode: 'insensitive' } },
              { requestCode: { contains: query.search, mode: 'insensitive' } },
              { email: { contains: query.search, mode: 'insensitive' } },
              { sector: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.companyAccessRequest.findMany({
        where,
        include: { status: true, city: true },
        orderBy: { submittedAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.companyAccessRequest.count({ where }),
    ]);

    return { rows, total };
  }

  async getSummary() {
    const [pending, inReview, approved, rejected] = await Promise.all([
      this.prisma.companyAccessRequest.count({
        where: { status: { title: 'PENDING' } },
      }),
      this.prisma.companyAccessRequest.count({
        where: { status: { title: 'IN_REVIEW' } },
      }),
      this.prisma.companyAccessRequest.count({
        where: { status: { title: 'APPROVED' } },
      }),
      this.prisma.companyAccessRequest.count({
        where: { status: { title: 'REJECTED' } },
      }),
    ]);

    return {
      pendingCount: pending + inReview,
      inReviewCount: inReview,
      approvedCount: approved,
      rejectedCount: rejected,
    };
  }

  async approveCompanyRequest(
    id: string,
    reviewerId: string,
    otpCodeHash: string,
    otpExpiresAt: Date,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const request = await tx.companyAccessRequest.findUniqueOrThrow({
        where: { id },
        include: { logoFile: true },
      });

      const [approvedStatus, companyRole] = await Promise.all([
        tx.accessRequestStatus.upsert({
          where: { title: 'APPROVED' },
          update: {},
          create: { title: 'APPROVED' },
        }),
        tx.role.upsert({
          where: { name: 'empresa' },
          update: {},
          create: { name: 'empresa' },
        }),
      ]);

      const company = await tx.company.create({
        data: {
          title: request.companyName,
          description: request.description,
        },
      });

      await tx.companyProfile.create({
        data: {
          companyId: company.id,
          sector: request.sector,
          email: request.email,
          phone: request.phone,
          websiteUrl: request.websiteUrl,
          cityId: request.cityId,
        },
      });

      if (request.logoFile) {
        await tx.companyLogo.create({
          data: {
            companyId: company.id,
            fileName: request.logoFile.name,
            mimeType: request.logoFile.mimeType,
            sizeBytes: request.logoFile.size,
            data: request.logoFile.content,
          },
        });
      }

      const user = await tx.user.create({
        data: {
          firstName: request.username,
          lastName: request.companyName,
          email: request.email,
          cityId: request.cityId,
          companyId: company.id,
          phone: request.phone,
          isActive: false,
          roles: {
            create: { roleId: companyRole.id },
          },
        },
      });

      await tx.$executeRaw`
        INSERT INTO radar_company_access (company_id,user_id)
        VALUES (${company.id}::uuid,${user.id}::uuid)
        ON CONFLICT (company_id,user_id) DO NOTHING`;

      const updated = await tx.companyAccessRequest.update({
        where: { id },
        data: {
          statusId: approvedStatus.id,
          reviewedById: reviewerId,
          reviewedAt: new Date(),
          approvedCompanyId: company.id,
          approvedUserId: user.id,
          logoFileId: null,
        },
      });

      await tx.companyActivationOtp.create({
        data: {
          companyAccessRequestId: id,
          codeHash: otpCodeHash,
          expiresAt: otpExpiresAt,
        },
      });

      if (request.logoFileId) {
        await tx.file.delete({ where: { id: request.logoFileId } });
      }

      return updated;
    });
  }

  async rejectCompanyRequest(id: string, reviewerId: string, reason: string) {
    const rejectedStatus = await this.prisma.accessRequestStatus.upsert({
      where: { title: 'REJECTED' },
      update: {},
      create: { title: 'REJECTED' },
    });

    return this.prisma.companyAccessRequest.update({
      where: { id },
      data: {
        statusId: rejectedStatus.id,
        reviewedById: reviewerId,
        reviewedAt: new Date(),
        rejectionReason: reason,
      },
    });
  }

  async observeCompanyRequest(id: string, reviewerId: string, reason: string) {
    const observedStatus = await this.prisma.accessRequestStatus.upsert({
      where: { title: 'OBSERVED' },
      update: {},
      create: { title: 'OBSERVED' },
    });

    return this.prisma.companyAccessRequest.update({
      where: { id },
      data: {
        statusId: observedStatus.id,
        reviewedById: reviewerId,
        reviewedAt: new Date(),
        rejectionReason: reason,
      },
      include: {
        status: true,
        city: true,
        documentFile: true,
        logoFile: true,
        openedBy: { select: { id: true, firstName: true, lastName: true } },
        reviewedBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  findCorrectionSnapshotByCode(requestCode: string) {
    return this.prisma.companyAccessRequest.findUnique({
      where: { requestCode },
      select: COMPANY_DOCUMENT_CORRECTION_SELECT,
    });
  }

  async replaceDocumentAndReopen(
    operation: ReplaceCompanyDocumentOperation,
  ): Promise<CompanyDocumentCorrectionResponse> {
    const { context, createFile } = operation;
    try {
      return await this.prisma.$transaction(
        async (tx): Promise<CompanyDocumentCorrectionResponse> => {
          await tx.companyAccessRequest.update({
            where: {
              id: context.requestId,
              requestCode: context.requestCode,
              status: { title: { in: [...COMPANY_CORRECTION_STATUSES] } },
              AND: [{ documentFileId: context.previousFileId }],
              reviewedAt: context.revision,
            },
            data: { status: { connect: { title: 'PENDING' } } },
            select: { id: true },
          });

          const file = await createFile(tx);
          await tx.companyAccessRequest.update({
            where: { id: context.requestId },
            data: {
              documentFile: { connect: { id: file.id } },
              rejectionReason: null,
              reviewedAt: null,
              reviewedBy: { disconnect: true },
              openedAt: null,
              openedBy: { disconnect: true },
              ocrMatchScore: null,
              ocrFieldResults: Prisma.DbNull,
            },
            select: { id: true },
          });

          return { requestCode: context.requestCode, status: 'PENDING' };
        },
      );
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === RECORD_NOT_FOUND_CODE
      ) {
        throw new CompanyDocumentCorrectionConflictException();
      }
      throw error;
    }
  }

  findByCodeAndEmail(requestCode: string, email: string) {
    return this.prisma.companyAccessRequest.findFirst({
      where: {
        requestCode: requestCode.trim().toUpperCase(),
        email: email.trim().toLowerCase(),
      },
      include: {
        status: true,
        activationOtps: {
          where: { usedAt: null },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });
  }

  async activateRecruiterAccount(
    requestId: string,
    otpId: string,
    userId: string,
    passwordHash: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      await tx.companyActivationOtp.update({
        where: { id: otpId },
        data: { usedAt: new Date() },
      });
      await tx.user.update({
        where: { id: userId },
        data: { password: passwordHash, isActive: true },
      });
      return { requestId, activated: true };
    });
  }

  findByEmailForActivation(email: string) {
    return this.prisma.companyAccessRequest.findFirst({
      where: {
        email: email.trim().toLowerCase(),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        status: true,
        city: true,
        approvedUser: true,
        activationOtps: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });
  }

  async recordInconsistencyReport(
    requestCode: string,
    email: string,
    observation: string,
  ) {
    const request = await this.prisma.companyAccessRequest.findFirst({
      where: {
        requestCode: requestCode.trim().toUpperCase(),
        email: email.trim().toLowerCase(),
      },
    });
    if (!request) {
      return null;
    }
    const timestamp = new Date().toLocaleString('es-BO');
    const existing = request.rejectionReason
      ? `${request.rejectionReason}\n\n`
      : '';
    const updatedNote =
      `${existing}[OBSERVACIÓN DEL POSTULANTE - ${timestamp}]: ${observation}`.slice(
        0,
        500,
      );

    return this.prisma.companyAccessRequest.update({
      where: { id: request.id },
      data: {
        rejectionReason: updatedNote,
      },
    });
  }

  findCompanyLogo(companyId: string) {
    return this.prisma.companyLogo.findUnique({
      where: { companyId },
    });
  }

  async updateData(id: string, data: Prisma.CompanyAccessRequestUpdateInput) {
    return this.prisma.companyAccessRequest.update({
      where: { id },
      data,
      include: {
        status: true,
        city: true,
        documentFile: true,
        logoFile: true,
        openedBy: { select: { id: true, firstName: true, lastName: true } },
        reviewedBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }
}
