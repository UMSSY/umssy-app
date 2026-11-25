import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module.js';
import { AccessRequestDetailsRepository } from './repositories/access-request-details.repository.js';
import { AccessRequestDetailsService } from './services/access-request-details.service.js';

@Module({
  imports: [PrismaModule],
  providers: [AccessRequestDetailsRepository, AccessRequestDetailsService],
  exports: [AccessRequestDetailsService],
})
export class AccessRequestDetailsModule {}
