import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtAuthModule } from '../../common/guards/jwt-auth.module.js';
import { PrismaModule } from '../../common/prisma/prisma.module.js';
import { PortfolioController } from './controllers/portfolio.controller.js';
import { PortfolioProjectMapper } from './mappers/portfolio-project.mapper.js';
import { PortfolioRepository } from './repositories/portfolio.repository.js';
import { SocialAccountRepository } from './repositories/social-account.repository.js';
import { PortfolioService } from './services/portfolio.service.js';
import { ProviderRepositoriesService } from './services/provider-repositories.service.js';
import { SocialOAuthService } from './services/social-oauth.service.js';

@Module({
  imports: [ConfigModule, PrismaModule, JwtAuthModule],
  controllers: [PortfolioController],
  providers: [
    PortfolioService,
    PortfolioRepository,
    SocialAccountRepository,
    ProviderRepositoriesService,
    SocialOAuthService,
    PortfolioProjectMapper,
  ],
  exports: [PortfolioService, SocialOAuthService],
})
export class PortfolioModule {}
