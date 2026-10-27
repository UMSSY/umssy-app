import { Client } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { PrismaService } from '../../../common/prisma/prisma.service.js';
import type { Prisma } from '../../../prisma/client.js';
import { CvMetadataRepository } from '../repositories/cv-metadata.repository.js';

const connectionString = process.env.CV_TEST_DATABASE_URL;
const userWithoutCvs = '11111111-1111-4111-8111-111111111111';
const userWithCvs = '22222222-2222-4222-8222-222222222222';
const missingUser = '33333333-3333-4333-8333-333333333333';

describe.skipIf(!connectionString)('CV count against PostgreSQL', () => {
  const client = new Client({ connectionString });
  const repository = new CvMetadataRepository({
    $queryRaw: async (query: Prisma.Sql) => (await client.query(query.text, query.values)).rows,
  } as unknown as PrismaService);

  beforeAll(async () => {
    await client.connect();
    // Las tablas temporales aíslan la prueba de cualquier dato existente.
    await client.query(`
      CREATE TEMP TABLE users (id uuid PRIMARY KEY);
      CREATE TEMP TABLE user_cv_file (
        id uuid PRIMARY KEY,
        user_id uuid NOT NULL REFERENCES users(id),
        cv_pdf_data text,
        cv_uploaded_at timestamptz
      );
    `);
    await client.query('INSERT INTO users VALUES ($1), ($2)', [userWithoutCvs, userWithCvs]);
    await client.query(`
      INSERT INTO user_cv_file VALUES
        ('44444444-4444-4444-8444-444444444441', $1, 'cGRm', now()),
        ('44444444-4444-4444-8444-444444444442', $1, 'cGRm', now()),
        ('44444444-4444-4444-8444-444444444443', $1, null, now()),
        ('44444444-4444-4444-8444-444444444444', $1, 'cGRm', null)
    `, [userWithCvs]);
  });

  afterAll(async () => {
    await client.end();
  });

  it('returns null for a user that does not exist', async () => {
    await expect(repository.countByUserId(missingUser)).resolves.toBeNull();
  });

  it('returns zero for an existing user without cvs', async () => {
    await expect(repository.countByUserId(userWithoutCvs)).resolves.toBe(0);
  });

  it('counts only visible cvs belonging to the requested user', async () => {
    await expect(repository.countByUserId(userWithCvs)).resolves.toBe(2);
  });
});
