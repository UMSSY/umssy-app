import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../../prisma/client.js';
import { buildDatabaseUrl } from './database-url.js';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const schema = process.env.DB_SCHEMA;
    const adapter = new PrismaPg(
      { connectionString: buildDatabaseUrl(process.env) },
      schema ? { schema } : undefined,
    );
    super({ adapter });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
