// Local-only HTTP + PostgreSQL verification. Build backend first.
import assert from 'node:assert/strict';
import { createHmac, randomBytes } from 'node:crypto';
import { spawn } from 'node:child_process';
import { readdir, readFile } from 'node:fs/promises';
import { once } from 'node:events';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../dist/prisma/client.js';

const connection = process.env.HU7_TEST_DATABASE_URL;
if (!connection || !['127.0.0.1', 'localhost', '[::1]'].includes(new URL(connection).hostname)) {
  throw new Error('HU7_TEST_DATABASE_URL debe apuntar a PostgreSQL local de pruebas.');
}
const database = `hu7_http_${randomBytes(6).toString('hex')}`;
const url = new URL(connection);
const admin = new pg.Client({ connectionString: connection });
await admin.connect();
await admin.query(`CREATE DATABASE "${database}"`);
url.pathname = `/${database}`;
const sql = new pg.Client({ connectionString: url.toString() });
let prisma, server;
let logs = '';
const port = Number(process.env.HU7_HTTP_PORT ?? 8085);
const secret = randomBytes(32).toString('hex');
const origin = `http://127.0.0.1:${port}/api`;
const users = [];

function token(user) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ sub: user, roleTag: 'titulado', roles: ['titulado'], exp: Math.floor(Date.now() / 1000) + 300 })).toString('base64url');
  const content = `${header}.${payload}`;
  return `${content}.${createHmac('sha256', secret).update(content).digest('base64url')}`;
}
async function api(user, path, method = 'GET', body) {
  const response = await fetch(`${origin}${path}`, {
    method, headers: { ...(user ? { Authorization: `Bearer ${token(user)}` } : {}), 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(10000),
  });
  return { status: response.status, body: await response.json() };
}
try {
  await sql.connect();
  const migrations = new URL('../prisma/migrations/', import.meta.url);
  for (const name of (await readdir(migrations)).filter((name) => /^\d/.test(name)).sort()) {
    await sql.query(await readFile(new URL(`${name}/migration.sql`, migrations), 'utf8'));
  }
  prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url.toString(), options: '-c TimeZone=UTC' }) });
  const graduate = await prisma.role.create({ data: { name: 'titulado' } });
  const mentor = await prisma.role.create({ data: { name: 'mentor' } });
  const approved = await prisma.accessRequestStatus.create({ data: { title: 'approved' } });
  const career = await prisma.career.create({ data: { title: 'HU7 HTTP' } });
  const area = await prisma.technicalArea.create({ data: { name: 'Backend' } });
  const orientation = await prisma.orientationType.create({ data: { name: 'Orientación técnica' } });
  const preferences = { technicalAreaIds: [area.id], orientationTypeIds: [orientation.id] };
  for (let i = 0; i < 5; i++) {
    const user = await prisma.user.create({ data: { firstName: 'HU7', lastName: `HTTP ${i}`, email: `hu7.http.${i}@example.test` } });
    users.push(user.id);
    await prisma.userRole.create({ data: { userId: user.id, roleId: graduate.id } });
    const request = await prisma.accessRequest.create({ data: {
      firstName: user.firstName, lastName: user.lastName, email: user.email,
      idCardNumber: `700000${i}`, sisCode: `7000000${i}`, idCardIssuedIn: 'CB',
      birthDate: new Date('1990-01-01'), graduationYear: 2025, careerId: career.id, statusId: approved.id,
    } });
    await sql.query('UPDATE access_requests SET approved_user_id = $1 WHERE id = $2', [user.id, request.id]);
    if (i < 2) await prisma.userRole.create({ data: { userId: user.id, roleId: mentor.id } });
  }
  server = spawn(process.execPath, ['dist/main.js'], {
    cwd: new URL('../', import.meta.url), windowsHide: true,
    env: { ...process.env, NODE_ENV: 'test', PORT: String(port), DB_USER: url.username,
      DB_PASSWORD: decodeURIComponent(url.password), DB_HOST: url.hostname, DB_PORT: url.port, DB_NAME: database,
      JWT_SECRET: secret, JWT_EXPIRES_IN: '5m', JWT_ALGORITHM: 'HS256', MAIL_TRANSPORT: 'console', CORS_ORIGIN: 'http://localhost:3000' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  server.stdout.on('data', (chunk) => { logs = (logs + chunk).slice(-10000); });
  server.stderr.on('data', (chunk) => { logs = (logs + chunk).slice(-10000); });
  let ready = false;
  for (let i = 0; i < 480; i++) {
    if (server.exitCode !== null) throw new Error(`El backend terminó: ${logs}`);
    try { if ((await api(users[2], '/mentors/capacity')).status === 200) { ready = true; break; } } catch { /* Wait for Nest bootstrap. */ }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  assert.ok(ready, `El backend no inició: ${logs}`);
  assert.equal((await api(null, '/mentor-participation/requests/me')).status, 401);
  assert.equal((await api(users[2], '/mentors/capacity')).body.data.available, 0);
  const first = await api(users[2], '/mentor-participation/requests', 'POST', preferences);
  assert.equal(first.status, 201);
  const original = first.body.data;
  const duplicate = await api(users[2], '/mentor-participation/requests', 'POST', preferences);
  assert.equal(duplicate.status, 409);
  assert.equal(duplicate.body.data.code, 'REQUEST_ALREADY_EXISTS');
  let current = (await api(users[2], '/mentor-participation/requests/me')).body.data;
  assert.equal(current.id, original.id);
  assert.equal(current.queuedAt, original.queuedAt);
  assert.equal(current.email, 'hu7.http.2@example.test');
  assert.equal((await api(users[2], '/mentor-participation/requests/me', 'PATCH', preferences)).status, 200);
  assert.equal((await api(users[3], '/mentor-participation/requests', 'POST', preferences)).status, 201);
  assert.equal((await api(users[4], '/mentor-participation/requests', 'POST', preferences)).status, 201);
  assert.equal((await api(users[4], '/mentor-participation/requests/me', 'DELETE')).status, 200);
  assert.equal((await api(users[4], '/mentor-participation/requests/me')).body.data.status, 'CANCELLED');
  assert.equal((await api(users[0], '/mentors/me/leave', 'POST')).status, 201);
  current = (await api(users[2], '/mentor-participation/requests/me')).body.data;
  assert.equal(current.status, 'OFFERED');
  assert.equal(new Date(current.offer.expiresAt) - new Date(current.offer.offeredAt), 86400000);
  const confirms = await Promise.all([
    api(users[2], `/mentors/offers/${current.offer.id}/confirm`, 'POST'),
    api(users[2], `/mentors/offers/${current.offer.id}/confirm`, 'POST'),
  ]);
  assert.ok(confirms.every((result) => result.status === 201));
  assert.equal(await prisma.userRole.count({ where: { userId: users[2], roleId: mentor.id, deletedAt: null } }), 1);
  assert.equal((await api(users[2], '/mentor-participation/requests/me')).body.data.status, 'ACTIVE');
  assert.equal((await api(users[1], '/mentors/me/leave', 'POST')).status, 201);
  const secondOffer = (await api(users[3], '/mentor-participation/requests/me')).body.data.offer;
  await sql.query("UPDATE mentor_slot_offers SET offered_at = clock_timestamp() - interval '25 hours', expires_at = clock_timestamp() - interval '1 hour' WHERE id = $1", [secondOffer.id]);
  assert.equal((await api(users[3], '/mentor-participation/requests/me')).body.data.status, 'EXPIRED');
  assert.equal((await api(users[3], `/mentors/offers/${secondOffer.id}/confirm`, 'POST')).status, 409);
  const retry = await api(users[3], '/mentor-participation/requests', 'POST', preferences);
  assert.equal(retry.status, 409);
  assert.equal(retry.body.data.code, 'CAPACITY_AVAILABLE');
  assert.equal((await api(users[3], '/mentors/activate', 'POST', preferences)).status, 201);
  assert.equal((await api(users[3], '/mentor-participation/requests/me')).body.data, null);
  assert.equal((await api(users[3], '/mentors/me/technical-areas')).status, 200);
  console.log('HU7 HTTP: autenticación, cupos, solicitud, duplicados, edición, cancelación, FIFO, oferta, confirmación concurrente, expiración y activación directa: OK');
} finally {
  if (server && server.exitCode === null) { server.kill(); await once(server, 'exit'); }
  await prisma?.$disconnect();
  await sql.end();
  // Only the random database created by this run is removed.
  await admin.query(`DROP DATABASE "${database}" WITH (FORCE)`);
  await admin.end();
}
