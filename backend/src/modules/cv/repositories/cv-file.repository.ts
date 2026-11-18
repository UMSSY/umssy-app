import { CURRENT_CV_ORDER } from '../constants/current-cv-order.constants.js';
import type { TransactionContext } from '../../../common/types/transaction-context.types.js';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import { CvFileStorage } from '../types/cv-file-storage.type.js';

const cvContentSelect = { cvPdfData: true } as const;

const cvIdSelect = { id: true } as const;

@Injectable()
export class CvFileRepository implements CvFileStorage {
  findVerificationSources(userId: string, context?: TransactionContext) {
    return (context?.client ?? this.prisma).userCvFile.findMany({
      where: { userId, cvPdfData: { not: null } },
      select: { id: true },
    });
  }

  constructor(private readonly prisma: PrismaService) {}

  async hasByUserId(userId: string): Promise<boolean> {
    const cv = await this.prisma.userCvFile.findFirst({
      where: {
        userId,
        cvPdfData: { not: null },
        cvUploadedAt: { not: null },
      },
      select: cvIdSelect,
    });
    return cv !== null;
  }

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
  currentCvMetadata(userId: string) {
    return this.prisma.userCvFile.findFirst({
      where: { userId },
      orderBy: [...CURRENT_CV_ORDER],
      select: { id: true },
    });
  }

  currentCv(userId: string) {
    return this.prisma.userCvFile.findFirst({
      where: { userId },
      orderBy: [...CURRENT_CV_ORDER],
      select: { id: true, cvPdfData: true },
    });
  }

  cvById(cvId: string) {
    return this.prisma.userCvFile.findUnique({
      where: { id: cvId },
      select: { id: true, userId: true, cvPdfData: true, cvFileName: true },
    });
  }
}
