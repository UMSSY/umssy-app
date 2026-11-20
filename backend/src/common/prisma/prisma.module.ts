import { Global, Module } from '@nestjs/common';
import { TransactionService } from './transaction.service.js';
import { PrismaService } from './prisma.service.js';

@Global()
@Module({
  providers: [PrismaService, TransactionService],
  exports: [PrismaService, TransactionService],
})
export class PrismaModule {}
