import { Module } from '@nestjs/common';
import { JwtAuthModule } from '../../common/guards/jwt-auth.module.js';
import { PrismaModule } from '../../common/prisma/prisma.module.js';
import { PortfolioProjectMapper } from './mappers/portfolio-project.mapper.js';
import { PortfolioController } from './portfolio.controller.js';
import { PortfolioRepository } from './portfolio.repository.js';
import { PortfolioService } from './portfolio.service.js';

@Module({
  imports: [PrismaModule, JwtAuthModule],
  controllers: [PortfolioController],
  providers: [
    PortfolioService,
    PortfolioRepository,
    PortfolioProjectMapper,
  ],
  exports: [PortfolioService, PortfolioRepository, PortfolioProjectMapper],
})
export class PortfolioModule {}

