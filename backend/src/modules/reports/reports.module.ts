import { Module } from '@nestjs/common';
import { JwtAuthModule } from '../../common/guards/jwt-auth.module.js';
import { ReportsController } from './controllers/reports.controller.js';
import { GeneratedReportsRepository } from './repositories/generated-reports.repository.js';
import { ReportUsersRepository } from './repositories/report-users.repository.js';
import { ReportAuthorService } from './services/report-author.service.js';
import { ReportHistoryService } from './services/report-history.service.js';
import { ReportPdfService } from './services/report-pdf.service.js';
import { ReportsService } from './services/reports.service.js';

@Module({
  imports: [JwtAuthModule],
  controllers: [ReportsController],
  providers: [
    ReportsService,
    ReportPdfService,
    ReportAuthorService,
    ReportUsersRepository,
    ReportHistoryService,
    GeneratedReportsRepository,
  ],
  exports: [
    ReportHistoryService,
    GeneratedReportsRepository,
    ReportPdfService,
    ReportAuthorService,
  ],
})
export class ReportsModule {}
