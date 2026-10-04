import { Module } from '@nestjs/common';
import { TechnicalAreasController } from './controllers/technical-areas.controller.js';
import { TechnicalAreasService } from './services/technical-areas.service.js';
import { TechnicalAreasRepository } from './repositories/technical-areas.repository.js';
import { TechnicalAreasMapper } from './mappers/technical-areas.mapper.js';

@Module({
  controllers: [TechnicalAreasController],
  providers: [
    TechnicalAreasService,
    TechnicalAreasRepository,
    TechnicalAreasMapper,
  ],
  exports: [TechnicalAreasService],
})
export class TechnicalAreasModule {}