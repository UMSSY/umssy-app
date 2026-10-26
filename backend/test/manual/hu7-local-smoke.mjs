// Prueba de extremo a extremo, solo contra los servicios locales portables.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

const api = process.env.HU7_API_URL ?? 'http://127.0.0.1:8081/api';
const mailpit = process.env.HU7_MAILPIT_URL ?? 'http://127.0.0.1:8026';
for (const url of [api, mailpit]) {
  assert.ok(['localhost', '127.0.0.1', '::1'].includes(new URL(url).hostname), 'Solo localhost');
}

async function call(path, { method = 'GET', token, body, key } = {}) {
  const response = await fetch(`${api}${path}`, { method, headers: {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(key ? { 'Idempotency-Key': key } : {}),
    ...(body ? { 'Content-Type': 'application/json' } : {}),
  }, body: body ? JSON.stringify(body) : undefined });
  const json = await response.json();
  return { status: response.status, data: json.data, detail: json.detail,
    retryAfter: response.headers.get('retry-after') };
}

async function login(email, roleTag = 'titulado') {
  const response = await call('/auth/login', { method: 'POST', body: { email, password: 'Prueba123', roleTag } });
  assert.equal(response.status, 201, `Inicio de sesión: ${email}: ${response.detail}`);
  return response.data.accessToken;
}

function expectError(response, status, code) {
  assert.equal(response.status, status, response.detail);
  assert.equal(response.data?.code, code);
}

const [areas, orientations] = await Promise.all([call('/technical-areas'), call('/orientation-types')]);
const first = (value) => Array.isArray(value) ? value[0] : value?.data?.[0];
const preferences = { technicalAreaIds: [first(areas.data).id], orientationTypeIds: [first(orientations.data).id] };

const pendingToken = await login('hu7.10@umssy.test');
const beforePending = await call('/mentor-participation/me', { token: pendingToken });
assert.equal(beforePending.data.status, 'PENDING');
for (let index = 0; index < 4; index += 1) {
  expectError(await call('/mentor-participation/requests', { method: 'POST', token: pendingToken,
    key: randomUUID(), body: preferences }), 409, 'DUPLICATE_REQUEST');
}
const fifthKey = randomUUID();
const fifth = await call('/mentor-participation/requests', { method: 'POST', token: pendingToken,
  key: fifthKey, body: preferences });
expectError(fifth, 429, 'MENTOR_REQUEST_SUSPENDED');
assert.ok(Number(fifth.retryAfter) > 71 * 3600);
const replay = await call('/mentor-participation/requests', { method: 'POST', token: pendingToken,
  key: fifthKey, body: preferences });
expectError(replay, 429, 'MENTOR_REQUEST_SUSPENDED');
assert.equal(replay.data.sanctionEndsAt, fifth.data.sanctionEndsAt);
expectError(await call('/mentor-participation/requests', { method: 'POST', token: pendingToken,
  key: randomUUID(), body: preferences }), 429, 'MENTOR_REQUEST_SUSPENDED');
const afterPending = await call('/mentor-participation/me', { token: pendingToken });
assert.equal(afterPending.data.status, 'PENDING');
assert.equal(afterPending.data.request.id, beforePending.data.request.id);
assert.equal(afterPending.data.request.requestedAt, beforePending.data.request.requestedAt);
assert.ok(afterPending.data.sanction);
process.stdout.write('OK: 5 solicitudes HU7, 72 h, reintento idempotente y solicitud pendiente conservada\n');

const activateToken = await login('hu7.21@umssy.test');
for (let index = 0; index < 4; index += 1) {
  expectError(await call('/mentors/activate', { method: 'POST', token: activateToken,
    key: randomUUID(), body: preferences }), 409, 'NO_SLOTS');
}
expectError(await call('/mentors/activate', { method: 'POST', token: activateToken,
  key: randomUUID(), body: preferences }), 429, 'MENTOR_REQUEST_SUSPENDED');
process.stdout.write('OK: el ingreso HU3 comparte el mismo control de 5 intentos\n');

const blockedToken = await login('mentor.b@umssy.test', 'mentor');
expectError(await call('/mentor-participation/me/leave', { method: 'POST', token: blockedToken }),
  409, 'FUTURE_APPOINTMENTS');
assert.equal((await call('/mentor-participation/me', { token: blockedToken })).data.status, 'ACTIVE');
process.stdout.write('OK: citas futuras impiden pausar y conservan el rol\n');

const pauseToken = await login('hu7.02@umssy.test', 'mentor');
const beforeCapacity = (await call('/mentor-participation/capacity', { token: pauseToken })).data;
const paused = await call('/mentor-participation/me/leave', { method: 'POST', token: pauseToken });
assert.equal(paused.status, 201);
assert.equal(paused.data.status, 'LEFT');
const repeatedPause = await call('/mentor-participation/me/leave', { method: 'POST', token: pauseToken });
assert.equal(repeatedPause.status, 201);
assert.equal(repeatedPause.data.alreadyLeft, true);
assert.equal((await call('/mentor-participation/me', { token: pauseToken })).data.status, 'LEFT');
const afterCapacity = (await call('/mentor-participation/capacity', { token: pauseToken })).data;
assert.equal(afterCapacity.activeMentors, beforeCapacity.activeMentors - 1);
assert.equal(afterCapacity.reservedOffers, beforeCapacity.reservedOffers + 1);
const returnToken = await login('hu7.02@umssy.test');
expectError(await call('/mentors/activate', { method: 'POST', token: returnToken,
  key: randomUUID(), body: preferences }), 409, 'NO_SLOTS');
const queued = await call('/mentor-participation/requests', { method: 'POST', token: returnToken,
  key: randomUUID(), body: preferences });
assert.equal(queued.status, 201);
assert.equal(queued.data.status, 'PENDING');
process.stdout.write('OK: pausa libera un cupo una vez, ofrece al FIFO y el retorno vuelve al control del 40%\n');

const deadline = Date.now() + 45_000;
let sanctionMails = [];
do {
  const response = await fetch(`${mailpit}/api/v1/messages`);
  assert.equal(response.status, 200);
  const list = await response.json();
  sanctionMails = (list.messages ?? []).filter((message) =>
    /Suspensión temporal de solicitudes de mentoría/.test(message.Subject ?? '') &&
    (message.To ?? []).some((recipient) => ['hu7.10@umssy.test', 'hu7.21@umssy.test'].includes(recipient.Address)));
  if (sanctionMails.length >= 2) break;
  await new Promise((resolve) => setTimeout(resolve, 2000));
} while (Date.now() < deadline);
assert.equal(sanctionMails.length, 2, 'Mailpit debe contener exactamente un correo por sanción nueva');
process.stdout.write('OK: Mailpit recibió exactamente dos avisos institucionales de sanción\n');
