import type { TransactionContext } from '../../../common/types/transaction-context.types.js';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import { CvFileStorage } from '../types/cv-file-storage.type.js';

const cvContentSelect = { cvPdfData: true } as const;

const cvIdSelect = { id: true } as const;

@Injectable()
export class CvFileRepository implements CvFileStorage {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    userId: string,
    content: Buffer,
    fileName?: string,
  ): Promise<string> {
    const cv = await this.prisma.userCvFile.create({
      data: {
        userId,
        cvFileName: fileName ?? null,
        cvUploadedAt: new Date(),
        cvPdfData: content.toString('base64'),
      },
      select: cvIdSelect,
    });

    return cv.id;
  }

  async readById(userId: string, cvId: string): Promise<Buffer | null> {
    const cv = await this.prisma.userCvFile.findFirst({
      where: { id: cvId, userId },
      select: cvContentSelect,
    });

    return cv?.cvPdfData ? Buffer.from(cv.cvPdfData, 'base64') : null;
  }

  async removeById(userId: string, cvId: string): Promise<boolean> {
    const { count } = await this.prisma.userCvFile.deleteMany({
      where: { id: cvId, userId },
    });

    return count > 0;
  }
  currentCv(userId: string) {
    return this.prisma.userCvFile.findFirst({
      where: { userId },
      orderBy: { cvUploadedAt: 'desc' },
      select: { id: true, cvPdfData: true },
    });
  }

  cvById(cvId: string) {
    return this.prisma.userCvFile.findUnique({
      where: { id: cvId },
      select: { id: true, userId: true, cvPdfData: true, cvFileName: true },
    });
  }
  findEvidenceRows(userId: string, context?: TransactionContext) {
    const client = context?.client ?? this.prisma;
    return client.$queryRaw<
      { id: string; hasDocument: boolean }[]
    >`SELECT id, cv_pdf_data IS NOT NULL AS "hasDocument" FROM user_cv_file WHERE user_id=${userId}::uuid`;
  }
  async currentCvReference(userId: string) {
    const [row] = await this.prisma.$queryRaw<
      { id: string; hasDocument: boolean }[]
    >`
      SELECT id,cv_pdf_data IS NOT NULL AS "hasDocument" FROM user_cv_file WHERE user_id=${userId}::uuid
      ORDER BY COALESCE(cv_uploaded_at,created_at) DESC,id DESC LIMIT 1`;
    return row;
  }
}
