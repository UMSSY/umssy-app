import { Module } from '@nestjs/common';
import { JwtAuthModule } from '../../common/guards/jwt-auth.module.js';
import { PrismaModule } from '../../common/prisma/prisma.module.js';
import { PortfolioController } from './controllers/portfolio.controller.js';
import { PortfolioProjectMapper } from './mappers/portfolio-project.mapper.js';
import { PortfolioRepository } from './repositories/portfolio.repository.js';
import { PortfolioService } from './services/portfolio.service.js';

@Module({
  imports: [PrismaModule, JwtAuthModule],
  controllers: [PortfolioController],
  providers: [
    PortfolioService,
    PortfolioRepository,
    PortfolioProjectMapper,
  ],
  exports: [PortfolioService],
})
export class PortfolioModule {}
