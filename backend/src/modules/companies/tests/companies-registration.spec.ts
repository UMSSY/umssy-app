import 'reflect-metadata';
import { MODULE_METADATA } from '@nestjs/common/constants.js';
import { describe, expect, it } from 'vitest';
import { AppModule } from '../../../app.module.js';
import { CompaniesModule } from '../companies.module.js';

describe('CompaniesModule registration', () => {
  it('is imported by AppModule so its routes are exposed', () => {
    const imports: unknown[] = Reflect.getMetadata(
      MODULE_METADATA.IMPORTS,
      AppModule,
    );

    expect(imports).toContain(CompaniesModule);
  });
});
