import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module.js';
import { CertificationsController } from './controllers/certifications.controller.js';
import { CertificationMapper } from './mappers/certification.mapper.js';
import { CertificationsRepository } from './repositories/certifications.repository.js';
import { CertificationsService } from './services/certifications.service.js';

@Module({
  imports: [PrismaModule],
  controllers: [CertificationsController],
  providers: [
    CertificationsService,
    CertificationsRepository,
    CertificationMapper,
  ],
})
export class CertificationsModule {}
