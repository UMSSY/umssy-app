import { MODULE_METADATA } from '@nestjs/common/constants.js';
import { describe, expect, it } from 'vitest';
import { AppModule } from '../../../app.module.js';
import { JobOffersModule } from '../job-offers.module.js';

describe('Registro de JobOffersModule', () => {
  it('está importado en AppModule para que sus rutas existan y aparezcan en Swagger', () => {
    const imports = Reflect.getMetadata(MODULE_METADATA.IMPORTS, AppModule) as unknown[];

    expect(imports).toContain(JobOffersModule);
  });
});
