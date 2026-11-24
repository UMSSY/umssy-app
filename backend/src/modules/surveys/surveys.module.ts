import { Module } from '@nestjs/common';
import { JwtAuthModule } from '../../common/guards/jwt-auth.module.js';
import { CareersController } from './controllers/careers.controller.js';
import { SurveyNotificationsController } from './controllers/survey-notifications.controller.js';
import { SurveysController } from './controllers/surveys.controller.js';
import { SurveyMapper } from './mappers/survey.mapper.js';
import { CareersRepository } from './repositories/careers.repository.js';
import { SurveyEmploymentResponsesRepository } from './repositories/survey-employment-responses.repository.js';
import { SurveysRepository } from './repositories/surveys.repository.js';
import { ReportsModule } from '../reports/reports.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { UsersModule } from '../users/users.module.js';
import { CareersService } from './services/careers.service.js';
import { SurveyEmploymentResponsesService } from './services/survey-employment-responses.service.js';
import { SurveyPdfService } from './services/survey-pdf.service.js';
import { SurveyAudienceService } from './services/survey-audience.service.js';
import { SurveyParticipationService } from './services/survey-participation.service.js';
import { SurveysService } from './services/surveys.service.js';
import { SurveyVariationEvaluatorService } from './services/survey-variation-evaluator.service.js';
import { SurveyLifecycleWorkerService } from './services/survey-lifecycle-worker.service.js';

@Module({
  imports: [
    JwtAuthModule,
    ReportsModule,
    NotificationsModule,
    UsersModule,
  ],
  controllers: [
    SurveyNotificationsController,
    SurveysController,
    CareersController,
  ],
  providers: [
    SurveysService,
    SurveyParticipationService,
    SurveyAudienceService,
    CareersService,
    SurveysRepository,
    CareersRepository,
    SurveyMapper,
    SurveyPdfService,
    SurveyVariationEvaluatorService,
    SurveyLifecycleWorkerService,
    SurveyEmploymentResponsesService,
    SurveyEmploymentResponsesRepository,
  ],
  exports: [CareersService, SurveyEmploymentResponsesService],
})
export class SurveysModule {}
