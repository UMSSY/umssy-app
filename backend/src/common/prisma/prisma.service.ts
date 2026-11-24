import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../prisma/client.js';
import { buildDatabaseConnectionString } from './build-connection-string.js';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    super({
      adapter: new PrismaPg({
        connectionString: buildDatabaseConnectionString('runtime'),
        options: '-c TimeZone=UTC',
        max: Number(process.env.DB_POOL_MAX ?? 20),
        connectionTimeoutMillis: Number(
          process.env.DB_POOL_TIMEOUT_MS ?? 30_000,
        ),
        idleTimeoutMillis: 30_000,
      }),
    });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
