import { Module } from '@nestjs/common';
import { JwtAuthModule } from '../../common/guards/jwt-auth.module.js';
import { CareersController } from './controllers/careers.controller.js';
import { SurveyNotificationsController } from './controllers/survey-notifications.controller.js';
import { SurveysController } from './controllers/surveys.controller.js';
import { SurveyMapper } from './mappers/survey.mapper.js';
import { CareersRepository } from './repositories/careers.repository.js';
import { SurveysRepository } from './repositories/surveys.repository.js';
import { ReportsModule } from '../reports/reports.module.js';
import { MailModule } from '../mail/mail.module.js';
import { CareersService } from './services/careers.service.js';
import { SurveyPdfService } from './services/survey-pdf.service.js';
import { SurveysService } from './services/surveys.service.js';
import { SurveyVariationEvaluatorService } from './services/survey-variation-evaluator.service.js';
import { SurveyLifecycleWorkerService } from './services/survey-lifecycle-worker.service.js';

@Module({
  imports: [JwtAuthModule, ReportsModule, MailModule],
  controllers: [
    SurveyNotificationsController,
    SurveysController,
    CareersController,
  ],
  providers: [
    SurveysService,
    CareersService,
    SurveysRepository,
    CareersRepository,
    SurveyMapper,
    SurveyPdfService,
    SurveyVariationEvaluatorService,
    SurveyLifecycleWorkerService,
  ],
})
export class SurveysModule {}
