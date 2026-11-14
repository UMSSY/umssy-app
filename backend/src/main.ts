import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { cleanupOpenApiDoc } from 'nestjs-zod';
import { AppModule } from './app.module.js';
import { parseCorsOrigins } from './common/utils/cors-origins.js';
import { validateEnv } from './common/utils/validate-env.js';
import { securityHeaders } from './config/security-headers.config.js';
import { buildSwaggerConfig } from './config/swagger.config.js';

async function bootstrap(): Promise<void> {
  validateEnv();

  const app = await NestFactory.create(AppModule);
  app.use(securityHeaders);
  app.use(cookieParser());

  const corsOrigins = parseCorsOrigins();

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    exposedHeaders: ['Content-Disposition', 'Retry-After'],
  });
  app.setGlobalPrefix('api');

  const config = buildSwaggerConfig();

  const documentFactory = () =>
    cleanupOpenApiDoc(SwaggerModule.createDocument(app, config));
  SwaggerModule.setup('docs', app, documentFactory, {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  console.log(
    `[bootstrap] listening on port ${port}; cors origins=${
      corsOrigins.length > 0 ? corsOrigins.join(', ') : '(default: all origins)'
    }`,
  );
}

void bootstrap().catch((error: unknown) => {
  console.error('[bootstrap] FAILED', error);
  process.exit(1);
});
