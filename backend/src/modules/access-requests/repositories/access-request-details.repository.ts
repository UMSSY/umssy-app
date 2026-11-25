import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import type { AccessRequestApplicantDetails } from '../types/access-request-applicant-details.types.js';

@Injectable()
export class AccessRequestDetailsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findApplicantDetails(
    accessRequestId: string,
  ): Promise<AccessRequestApplicantDetails | null> {
    return this.prisma.accessRequest.findUnique({
      where: { id: accessRequestId },
      select: {
        graduationYear: true,
        documentType: { select: { title: true } },
      },
    });
  }
}
