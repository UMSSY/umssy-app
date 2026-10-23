import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import { cleanupOpenApiDoc } from 'nestjs-zod';
import { AppModule } from './app.module.js';
import { validateEnv } from './common/utils/validate-env.js';
import { buildSwaggerConfig } from './config/swagger.config.js';

async function bootstrap(): Promise<void> {
  validateEnv();

  const app = await NestFactory.create(AppModule);

  const corsOrigins = (process.env.CORS_ORIGIN ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

  app.enableCors({
    origin: corsOrigins,
    exposedHeaders: ['Content-Disposition'],
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

  const localUrl = new URL(await app.getUrl());
  if (localUrl.hostname === '[::]' || localUrl.hostname === '0.0.0.0') {
    localUrl.hostname = 'localhost';
  }

  console.log(`[bootstrap] API local: ${localUrl.origin}/api`);
  console.log(`[bootstrap] Swagger local: ${localUrl.origin}/docs`);
  for (const origin of corsOrigins) {
    if (/^https?:\/\//.test(origin)) {
      console.log(
        `[bootstrap] Frontend configurado (login): ${origin.replace(/\/+$/, '')}/login`,
      );
    }
  }
}

try {
  await bootstrap();
} catch (error: unknown) {
  console.error('[bootstrap] FAILED', error);
  process.exit(1);
}
