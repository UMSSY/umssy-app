import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import { REJECTION_MAIL_SELECT } from '../constants/rejection-mail-select.constants.js';

@Injectable()
export class RejectionMailRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string) {
    return this.prisma.accessRequest.findUnique({ where: { id }, select: REJECTION_MAIL_SELECT });
  }
}
