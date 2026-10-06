import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import { cleanupOpenApiDoc } from 'nestjs-zod';
import { AppModule } from './app.module.js';
import { buildSwaggerConfig } from './config/swagger.config.js';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  const corsOrigins = (process.env.CORS_ORIGIN ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

  app.enableCors(corsOrigins.length > 0 ? { origin: corsOrigins } : {});
  app.setGlobalPrefix('api');

  const config = buildSwaggerConfig();

  const documentFactory = () => cleanupOpenApiDoc(SwaggerModule.createDocument(app, config));
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

try {
  await bootstrap();
} catch (error: unknown) {
  console.error('[bootstrap] FAILED', error);
  process.exit(1);
}
