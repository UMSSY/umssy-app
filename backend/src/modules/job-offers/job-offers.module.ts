import { Module } from '@nestjs/common';
import { JobOffersService } from './job-offers.service.js'
import { JobOffersController } from './job-offers.controller.js'

@Module({
  controllers: [JobOffersController],
  providers: [
    JobOffersService,
    {
      provide: 'PRISMA_SERVICE',
      useFactory: () => {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { PrismaService } = require('../../prisma/prisma.service');
        return new PrismaService();
      },
    },
  ],
  exports: [JobOffersService],
})
export class JobOffersModule {}