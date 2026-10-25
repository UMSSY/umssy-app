// Prepara dos solicitudes pendientes para los mockups 3, 5 y 6 en localhost.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

const api = `http://127.0.0.1:${process.env.PORT ?? '8081'}/api`;
async function call(path, token, method = 'GET', body) {
  const response = await fetch(`${api}${path}`, { method, headers: {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(body ? { 'Content-Type': 'application/json', 'Idempotency-Key': randomUUID() } : {}),
  }, body: body ? JSON.stringify(body) : undefined });
  return { status: response.status, result: await response.json() };
}
async function login(email) {
  const response = await call('/auth/login', null, 'POST', { email, password: 'Prueba123', roleTag: 'titulado' });
  assert.equal(response.status, 201);
  return response.result.data.accessToken;
}
const catalogToken = await login('hu7.14@umssy.test');
const areas = await call('/technical-areas', catalogToken);
const orientations = await call('/orientation-types', catalogToken);
const preferences = { technicalAreaIds: [areas.result.data[0].id], orientationTypeIds: [orientations.result.data[0].id] };
for (const email of ['hu7.14@umssy.test', 'hu7.20@umssy.test']) {
  const token = await login(email);
  const before = await call('/mentor-participation/me', token);
  if (['PENDING', 'OFFERED'].includes(before.result.data.status)) {
    process.stdout.write(`${email}: ${before.result.data.status} existente\n`);
    continue;
  }
  assert.ok(!before.result.data.sanction, `${email}: sanción vigente`);
  const created = await call('/mentor-participation/requests', token, 'POST', preferences);
  assert.equal(created.status, 201, JSON.stringify(created.result));
  assert.equal(created.result.data.status, 'PENDING');
  process.stdout.write(`${email}: PENDING creada\n`);
}
