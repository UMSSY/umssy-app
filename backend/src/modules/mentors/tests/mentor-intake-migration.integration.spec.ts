import { describe, expect, it } from 'vitest';
import { randomBytes, randomUUID } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import pg from 'pg';

const connectionString = process.env.HU7_TEST_DATABASE_URL;
describe.skipIf(!connectionString)('Migración aditiva de intentos HU7', () => {
  it('conserva una sanción anterior y sus conteos, y prepara un único correo pendiente', async () => {
    if (!['localhost', '127.0.0.1', '[::1]'].includes(new URL(connectionString!).hostname)) throw new Error('Solo PostgreSQL local');
    const sql = new pg.Client({ connectionString });
    const schema = `hu7_migration_test_${randomBytes(6).toString('hex')}`;
    let created = false;
    await sql.connect();
    try {
      await sql.query(`CREATE SCHEMA "${schema}"`);
      created = true;
      await sql.query(`SET search_path TO "${schema}", public`);
      const directory = new URL('../../../../prisma/migrations/', import.meta.url);
      const names = (await readdir(directory)).filter((name) => /^\d/.test(name)).sort();
      const target = '20261027030000_mentor_intake_idempotency_outbox';
      for (const name of names.filter((name) => name < target)) await sql.query(await readFile(new URL(`${name}/migration.sql`, directory), 'utf8'));
      const user = randomUUID();
      await sql.query('INSERT INTO users(id, first_name, last_name, email, updated_at) VALUES($1, $2, $3, $4, now())', [user, 'Migration', 'Test', 'migration@example.test']);
      const endsAt = new Date(Date.now() + 48 * 3600000);
      await sql.query("INSERT INTO mentor_participation_attempt_limits(user_id, attempt_count, window_started_at, blocked_until) VALUES($1, 5, now() - interval '1 hour', $2)", [user, endsAt]);
      await sql.query(await readFile(new URL(`${target}/migration.sql`, directory), 'utf8'));
      const sanctions = await sql.query('SELECT ends_at, extract(epoch FROM ends_at-started_at)::int AS seconds FROM mentor_participation_sanctions');
      expect(sanctions.rows).toEqual([{ ends_at: endsAt, seconds: 259200 }]);
      expect((await sql.query('SELECT attempt_count FROM mentor_participation_attempt_limits')).rows).toEqual([{ attempt_count: 5 }]);
      expect((await sql.query('SELECT count(*)::int AS count FROM mentor_intake_attempts')).rows).toEqual([{ count: 5 }]);
      expect((await sql.query('SELECT kind, status, recipient FROM mentor_mail_outbox')).rows).toEqual([{ kind: 'SANCTION', status: 'PENDING', recipient: 'migration@example.test' }]);
    } finally {
      if (created) await sql.query(`DROP SCHEMA "${schema}" CASCADE`);
      await sql.end();
    }
  }, 30000);
});
