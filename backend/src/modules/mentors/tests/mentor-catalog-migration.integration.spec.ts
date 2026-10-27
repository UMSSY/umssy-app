import { describe, expect, it } from 'vitest';
import { randomBytes, randomUUID } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import pg from 'pg';

const connectionString = process.env.HU7_TEST_DATABASE_URL;

describe.skipIf(!connectionString)('Conversión de catálogos HU7', () => {
  it('conserva el historial, plazos y correos y mantiene las restricciones al convertir estados', async () => {
    if (
      !['localhost', '127.0.0.1', '[::1]'].includes(
        new URL(connectionString!).hostname,
      )
    )
      throw new Error('Solo PostgreSQL local');
    const sql = new pg.Client({ connectionString });
    const schema = `hu7_catalog_test_${randomBytes(6).toString('hex')}`;
    let created = false;
    await sql.connect();
    try {
      await sql.query(`CREATE SCHEMA "${schema}"`);
      created = true;
      await sql.query(`SET search_path TO "${schema}", public`);
      const directory = new URL(
        '../../../../prisma/migrations/',
        import.meta.url,
      );
      const target = '20261027180000_mentor_participation_catalogs';
      for (const name of (await readdir(directory))
        .filter((name) => /^\d/.test(name) && name < target)
        .sort())
        await sql.query(
          await readFile(new URL(`${name}/migration.sql`, directory), 'utf8'),
        );
      const userId = randomUUID(),
        pendingId = randomUUID(),
        expiredId = randomUUID();
      const offeredId = randomUUID(),
        expiredOfferId = randomUUID(),
        mailId = randomUUID();
      const queuedAt = new Date('2025-01-02T03:04:05Z');
      await sql.query(
        "INSERT INTO users(id, first_name, last_name, email, updated_at) VALUES($1, 'Migration', 'Test', 'catalog@example.test', now())",
        [userId],
      );
      for (const [id, status] of [
        [pendingId, 'OFFERED'],
        [expiredId, 'EXPIRED'],
      ]) {
        await sql.query(
          `INSERT INTO mentor_participation_requests(id, user_id, status, queued_at, created_at, technical_area_ids, orientation_type_ids)
          VALUES($1, $2, $3, $4, $4, ARRAY[$5::uuid], ARRAY[$6::uuid])`,
          [id, userId, status, queuedAt, randomUUID(), randomUUID()],
        );
      }
      for (const [id, requestId, status] of [
        [offeredId, pendingId, 'OFFERED'],
        [expiredOfferId, expiredId, 'EXPIRED'],
      ]) {
        await sql.query(
          `INSERT INTO mentor_slot_offers(id, user_id, request_id, status, offered_at, expires_at)
          VALUES($1, $2, $3, $4, $5, $5::timestamptz + interval '24 hours')`,
          [id, userId, requestId, status, queuedAt],
        );
      }
      await sql.query(
        `INSERT INTO mentor_mail_outbox(id, event_key, kind, user_id, recipient, payload, status, attempts)
        VALUES($1, 'offer:existing', 'OFFER', $2, 'catalog@example.test', $3, 'SENDING', 2)`,
        [
          mailId,
          userId,
          JSON.stringify({
            offerId: offeredId,
            expiresAt: '2025-01-03T03:04:05Z',
          }),
        ],
      );
      const before = (
        await sql.query(
          'SELECT id, user_id, queued_at, created_at, technical_area_ids, orientation_type_ids FROM mentor_participation_requests ORDER BY id',
        )
      ).rows;
      const offersBefore = (
        await sql.query(
          'SELECT id, request_id, offered_at, expires_at FROM mentor_slot_offers ORDER BY id',
        )
      ).rows;
      const mailBefore = (
        await sql.query(
          'SELECT id, event_key, payload, recipient, attempts FROM mentor_mail_outbox',
        )
      ).rows;
      await sql.query(
        await readFile(new URL(`${target}/migration.sql`, directory), 'utf8'),
      );

      expect(
        (
          await sql.query(
            'SELECT id, user_id, queued_at, created_at, technical_area_ids, orientation_type_ids FROM mentor_participation_requests ORDER BY id',
          )
        ).rows,
      ).toEqual(before);
      expect(
        (
          await sql.query(
            'SELECT id, request_id, offered_at, expires_at FROM mentor_slot_offers ORDER BY id',
          )
        ).rows,
      ).toEqual(offersBefore);
      expect(
        (
          await sql.query(
            'SELECT id, event_key, payload, recipient, attempts FROM mentor_mail_outbox',
          )
        ).rows,
      ).toEqual(mailBefore);
      expect(
        (
          await sql.query(
            'SELECT mentor_request_status_title(status_id) AS status FROM mentor_participation_requests ORDER BY queued_at, status',
          )
        ).rows,
      ).toEqual([{ status: 'EXPIRED' }, { status: 'OFFERED' }]);
      expect(
        (
          await sql.query(
            'SELECT mentor_mail_kind_title(kind_id) AS kind, mentor_mail_status_title(status_id) AS status FROM mentor_mail_outbox',
          )
        ).rows,
      ).toEqual([{ kind: 'OFFER', status: 'SENDING' }]);
      expect(
        (
          await sql.query(
            'SELECT created_at IS NOT NULL AND updated_at IS NOT NULL AS audited FROM mentor_slot_offers',
          )
        ).rows,
      ).toEqual([{ audited: true }, { audited: true }]);

      await expect(
        sql.query(
          'UPDATE mentor_participation_requests SET status_id = $1 WHERE id = $2',
          [randomUUID(), pendingId],
        ),
      ).rejects.toMatchObject({ code: '23503' });
      await expect(
        sql.query(
          `INSERT INTO mentor_participation_requests(id, user_id, technical_area_ids, orientation_type_ids)
        VALUES($1, $2, ARRAY[$3::uuid], ARRAY[$4::uuid])`,
          [randomUUID(), userId, randomUUID(), randomUUID()],
        ),
      ).rejects.toMatchObject({ code: '23505' });
      await expect(
        sql.query(
          `INSERT INTO mentor_slot_offers(id, user_id, offered_at, expires_at)
        VALUES($1, $2, now(), now() + interval '24 hours')`,
          [randomUUID(), userId],
        ),
      ).rejects.toMatchObject({ code: '23505' });
      await sql.query(
        'UPDATE mentor_mail_outbox SET attempts = attempts + 1 WHERE id = $1',
        [mailId],
      );
      expect(
        (
          await sql.query(
            'SELECT updated_at >= created_at AS audited FROM mentor_mail_outbox WHERE id = $1',
            [mailId],
          )
        ).rows,
      ).toEqual([{ audited: true }]);
    } finally {
      if (created) await sql.query(`DROP SCHEMA "${schema}" CASCADE`);
      await sql.end();
    }
  }, 30000);
});
