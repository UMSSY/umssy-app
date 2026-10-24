import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import { CvFileStorage } from '../types/cv-file-storage.type.js';

const cvContentSelect = { cvPdfData: true } as const;

const cvIdSelect = { id: true } as const;

@Injectable()
export class CvFileRepository implements CvFileStorage {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, content: Buffer, fileName?: string): Promise<string> {
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

  // deleteMany scoped by owner never throws P2025 and cannot remove another user's cv.
  async removeById(userId: string, cvId: string): Promise<boolean> {
    const { count } = await this.prisma.userCvFile.deleteMany({
      where: { id: cvId, userId },
    });

    return count > 0;
  }
}
