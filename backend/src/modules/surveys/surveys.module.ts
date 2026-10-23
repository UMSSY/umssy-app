import { Module } from '@nestjs/common';
import { JwtAuthModule } from '../../common/guards/jwt-auth.module.js';
import { CareersController } from './controllers/careers.controller.js';
import { SurveysController } from './controllers/surveys.controller.js';
import { SurveyMapper } from './mappers/survey.mapper.js';
import { CareersRepository } from './repositories/careers.repository.js';
import { SurveysRepository } from './repositories/surveys.repository.js';
import { CareersService } from './services/careers.service.js';
import { SurveysService } from './services/surveys.service.js';

@Module({
  imports: [JwtAuthModule],
  controllers: [SurveysController, CareersController],
  providers: [
    SurveysService,
    CareersService,
    SurveysRepository,
    CareersRepository,
    SurveyMapper,
  ],
})
export class SurveysModule {}
