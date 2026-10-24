import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import { Prisma } from '../../../prisma/client.js';
import type { CvMetadataRecord } from '../types/cv-metadata-record.type.js';

// Rows without content or upload date are not listed, counted or served.
const visibleCvCondition = Prisma.raw(
  'cv_pdf_data IS NOT NULL AND cv_uploaded_at IS NOT NULL',
);

// Decoded size of the base64 content, computed without decoding every file.
const cvSizeBytes = Prisma.raw(
  "(length(cv_pdf_data) * 3 / 4 - CASE WHEN right(cv_pdf_data, 2) = '==' THEN 2 WHEN right(cv_pdf_data, 1) = '=' THEN 1 ELSE 0 END)",
);

const newestFirst = Prisma.raw('cv_uploaded_at DESC, id DESC');

@Injectable()
export class CvMetadataRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByIdForUser(userId: string, cvId: string): Promise<CvMetadataRecord | null> {
    const rows = await this.prisma.$queryRaw<CvMetadataRecord[]>(Prisma.sql`
      SELECT
        c.id AS "id",
        u.first_name AS "firstName",
        u.last_name AS "lastName",
        c.cv_file_name AS "fileName",
        ${cvSizeBytes} AS "sizeBytes",
        c.cv_uploaded_at AS "uploadedAt",
        c.id = (
          SELECT id
          FROM user_cv_file
          WHERE user_id = c.user_id AND ${visibleCvCondition}
          ORDER BY ${newestFirst}
          LIMIT 1
        ) AS "isCurrent"
      FROM user_cv_file c
      JOIN users u ON u.id = c.user_id
      WHERE c.id = ${cvId}::uuid AND c.user_id = ${userId}::uuid AND ${visibleCvCondition}
    `);

    return rows[0] ?? null;
  }

  async countByUserId(userId: string): Promise<number | null> {
    const rows = await this.prisma.$queryRaw<{ total: number }[]>(Prisma.sql`
      SELECT count(c.id)::int AS "total"
      FROM users u
      LEFT JOIN user_cv_file c ON c.user_id = u.id AND ${visibleCvCondition}
      WHERE u.id = ${userId}::uuid
    `);

    return rows[0]?.total ?? null;
  }

  findPageByUserId(
    userId: string,
    offset: number,
    limit: number,
  ): Promise<CvMetadataRecord[]> {
    return this.prisma.$queryRaw<CvMetadataRecord[]>(Prisma.sql`
      SELECT
        c.id AS "id",
        u.first_name AS "firstName",
        u.last_name AS "lastName",
        c.cv_file_name AS "fileName",
        ${cvSizeBytes} AS "sizeBytes",
        c.cv_uploaded_at AS "uploadedAt",
        (row_number() OVER (ORDER BY c.cv_uploaded_at DESC, c.id DESC) = 1) AS "isCurrent"
      FROM user_cv_file c
      JOIN users u ON u.id = c.user_id
      WHERE c.user_id = ${userId}::uuid AND ${visibleCvCondition}
      ORDER BY c.cv_uploaded_at DESC, c.id DESC
      LIMIT ${limit} OFFSET ${offset}
    `);
  }
}
