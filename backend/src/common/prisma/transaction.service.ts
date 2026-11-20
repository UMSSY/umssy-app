import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';
import type { TransactionContext } from '../types/transaction-context.types.js';

@Injectable()
export class TransactionService {
  constructor(private readonly prisma: PrismaService) {}

  run<T>(operation: (context: TransactionContext) => Promise<T>): Promise<T> {
    return this.prisma.$transaction((client) => operation({ client }));
  }
}
