// Ejecución única sobre cuentas ficticias locales .15, .16 y .20.
import 'dotenv/config';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import pg from 'pg';

const host = process.env.DB_HOST;
assert.ok(['localhost', '127.0.0.1', '::1'].includes(host), 'PostgreSQL debe ser local');
const pool = new pg.Pool({ host, port: Number(process.env.DB_PORT), database: process.env.DB_NAME,
  user: process.env.DB_USER, password: process.env.DB_PASSWORD });
const api = `http://127.0.0.1:${process.env.PORT ?? '8081'}/api`;
const request = async (path, token, body, key = randomUUID()) => {
  const response = await fetch(`${api}${path}`, { method: body ? 'POST' : 'GET', headers: {
    Authorization: `Bearer ${token}`, 'Idempotency-Key': key,
    ...(body ? { 'Content-Type': 'application/json' } : {}),
  }, body: body ? JSON.stringify(body) : undefined });
  return { status: response.status, body: await response.json() };
};
const login = async (email, roleTag = 'titulado') => {
  const response = await fetch(`${api}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'Prueba123', roleTag }) });
  assert.equal(response.status, 201);
  return (await response.json()).data.accessToken;
};
const rows = async (query, parameters = []) => (await pool.query(query, parameters)).rows;
const userId = async (email) => (await rows('SELECT id FROM users WHERE email = $1', [email]))[0].id;
const assertCode = (response, status, code) => {
  assert.equal(response.status, status, JSON.stringify(response.body));
  assert.equal(response.body.data?.code, code);
};

try {
  const area = (await request('/technical-areas', await login('hu7.20@umssy.test'))).body.data[0].id;
  const orientation = (await request('/orientation-types', await login('hu7.20@umssy.test'))).body.data[0].id;
  const preferences = { technicalAreaIds: [area], orientationTypeIds: [orientation] };

  // Ajuste temporal de un fixture expirado; el bloque finally restaura sus fechas.
  const expiredId = await userId('hu7.20@umssy.test');
  const original = (await rows('SELECT starts_at, expires_at FROM mentor_participation_sanctions WHERE user_id = $1 ORDER BY starts_at DESC LIMIT 1', [expiredId]))[0];
  assert.ok(original, 'fixture de sanción vencida');
  const token20 = await login('hu7.20@umssy.test');
  try {
    const almost = new Date();
    await pool.query('UPDATE mentor_participation_sanctions SET starts_at = $1, expires_at = $2 WHERE user_id = $3',
      [new Date(almost.getTime() - 71 * 3_600_000 - 59 * 60_000), new Date(almost.getTime() + 60_000), expiredId]);
    const activeView = await request('/mentor-participation/me', token20);
    assert.ok(activeView.body.data?.sanction, JSON.stringify({ row: (await rows('SELECT starts_at, expires_at, lifted_at FROM mentor_participation_sanctions WHERE user_id = $1', [expiredId]))[0],
      view: activeView.body.data }));
    assertCode(await request('/mentors/activate', token20, preferences), 429, 'MENTOR_REQUEST_SUSPENDED');
    await pool.query('UPDATE mentor_participation_sanctions SET starts_at = $1, expires_at = $2 WHERE user_id = $3',
      [new Date(Date.now() - 72 * 3_600_000), new Date(Date.now() - 1), expiredId]);
    assertCode(await request('/mentors/activate', token20, preferences), 409, 'NO_SLOTS');
    process.stdout.write('OK: 71 h 59 min bloqueado; a las 72 h vuelve a evaluar el cupo\n');
  } finally {
    await pool.query('UPDATE mentor_participation_sanctions SET starts_at = $1, expires_at = $2 WHERE user_id = $3',
      [original.starts_at, original.expires_at, expiredId]);
  }

  const windowId = await userId('hu7.15@umssy.test');
  const old = new Date(Date.now() - 25 * 3_600_000);
  for (let index = 0; index < 4; index += 1) {
    await pool.query(`INSERT INTO mentor_participation_attempts
      (id, user_id, idempotency_key, payload_hash, action, outcome, counted, status_code, response, occurred_at)
      VALUES ($1, $2, $3, 'boundary-test', 'ACTIVATE', 'NO_SLOTS', true, 409, '{}', $4)`,
    [randomUUID(), windowId, randomUUID(), new Date(old.getTime() - index * 60_000)]);
  }
  const token15 = await login('hu7.15@umssy.test');
  assertCode(await request('/mentors/activate', token15, preferences), 409, 'NO_SLOTS');
  assert.equal((await rows('SELECT count(*)::int AS n FROM mentor_participation_sanctions WHERE user_id = $1', [windowId]))[0].n, 0);
  for (let index = 0; index < 3; index += 1) {
    await pool.query(`INSERT INTO mentor_participation_attempts
      (id, user_id, idempotency_key, payload_hash, action, outcome, counted, status_code, response, occurred_at)
      VALUES ($1, $2, $3, 'boundary-test', 'ACTIVATE', 'NO_SLOTS', true, 409, '{}', $4)`,
    [randomUUID(), windowId, randomUUID(), new Date(Date.now() - (index + 1) * 60_000)]);
  }
  assertCode(await request('/mentors/activate', token15, preferences), 429, 'MENTOR_REQUEST_SUSPENDED');
  process.stdout.write('OK: cuatro intentos fuera de 24 h no sancionan; cinco recientes sí\n');

  const concurrentId = await userId('hu7.16@umssy.test');
  const token16 = await login('hu7.16@umssy.test');
  const results = await Promise.all(Array.from({ length: 5 }, () => request('/mentors/activate', token16, preferences)));
  assert.deepEqual(results.map(({ status }) => status).sort(), [409, 409, 409, 409, 429]);
  const sanctionCount = (await rows('SELECT count(*)::int AS n FROM mentor_participation_sanctions WHERE user_id = $1', [concurrentId]))[0].n;
  const emailCount = (await rows(`SELECT count(*)::int AS n FROM mentor_email_outbox
    WHERE recipient = $1 AND type = 'SANCTION'`, ['hu7.16@umssy.test']))[0].n;
  assert.equal(sanctionCount, 1);
  assert.equal(emailCount, 1);
  process.stdout.write('OK: cinco peticiones concurrentes generan una sanción y un correo\n');

  const pauseToken = await login('hu7.03@umssy.test', 'mentor');
  const before = (await request('/mentor-participation/capacity', pauseToken)).body.data;
  const pauses = await Promise.all([request('/mentor-participation/me/leave', pauseToken, {}),
    request('/mentor-participation/me/leave', pauseToken, {})]);
  assert.deepEqual(pauses.map(({ status }) => status), [201, 201]);
  assert.equal(pauses.filter(({ body }) => body.data?.alreadyLeft).length, 1);
  const after = (await request('/mentor-participation/capacity', pauseToken)).body.data;
  assert.equal(after.activeMentors, before.activeMentors - 1);
  assert.equal(after.reservedOffers, before.reservedOffers + 1);
  process.stdout.write('OK: dos pausas concurrentes liberan un solo cupo y reservan una oferta FIFO\n');
} finally {
  await pool.end();
}
