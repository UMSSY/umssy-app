import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import bcrypt from 'bcrypt';

// This script creates fixtures and injects a database fault. It must never run
// against Supabase or a shared database. Migrate the disposable database first.
if (!['127.0.0.1', 'localhost'].includes(process.env.DB_HOST)
  || !process.env.DB_NAME?.startsWith('umssy_epic2_qa')) {
  throw new Error('Use a disposable local database named umssy_epic2_qa*.');
}
Object.assign(process.env, {
  NODE_ENV: 'test', JWT_SECRET: 'local-epic2-radar-verification-only',
  JWT_EXPIRES_IN: '1h', JWT_ALGORITHM: 'HS256', MAIL_TRANSPORT: 'console',
  SMTP_USER: '', SMTP_PASSWORD: '',
});
const { NestFactory } = await import('@nestjs/core');
const { EDUCATION_DEGREES } = await import('../../dist/modules/educations/constants/education-degrees.constants.js');
const { AppModule } = await import('../../dist/app.module.js');
const { PrismaService } = await import('../../dist/common/prisma/prisma.service.js');
const { ProfileSkillSourcesRepository } = await import('../../dist/modules/nlp/repositories/profile-skill-sources.repository.js');
const { RadarIntegrationService } = await import('../../dist/modules/radar-integration/radar-integration.service.js');
const { scoreVerifiedSkills, RUBRIC_VERSION } = await import('../../dist/modules/radar-integration/radar-scoring.js');
const app = await NestFactory.create(AppModule, { logger: false, abortOnError: false });
app.setGlobalPrefix('api');
await app.listen(0, '127.0.0.1');
const base = `${await app.getUrl()}/api`;
const db = app.get(PrismaService);
const people = [];
const results = [];
const password = 'Local-QA-123!';
let faultInstalled = false;

async function check(name, operation) {
  const start = performance.now();
  await operation();
  results.push({ name, milliseconds: Math.round(performance.now() - start), passed: true });
  console.log(`PASS ${name}`);
}

async function request(path, token, method = 'GET', body, expected = 200) {
  const form = body instanceof FormData;
  const response = await fetch(`${base}${path}`, {
    method,
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(!form && body !== undefined ? { 'Content-Type': 'application/json' } : {}) },
    ...(body !== undefined ? { body: form ? body : JSON.stringify(body) } : {}),
  });
  const data = await response.json();
  assert.equal(response.status, expected, `${method} ${path}: ${JSON.stringify(data)}`);
  return data.data;
}

async function person(roleName) {
  const role = await db.role.upsert({ where: { name: roleName }, create: { name: roleName }, update: {} });
  const id = randomUUID();
  const email = `epic2-qa-${id}@example.test`;
  await db.user.create({ data: { id, email, password: await bcrypt.hash(password, 4), firstName: 'QA', lastName: roleName, roles: { create: { roleId: role.id } } } });
  people.push(id);
  const login = await request('/auth/login', null, 'POST', { email, password, roleTag: roleName }, 201);
  return { id, email, roleName, token: login.accessToken };
}

function pdf(text = '') {
  const stream = `BT /F1 12 Tf 40 700 Td (${text}) Tj ET`;
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`,
  ];
  let output = '%PDF-1.7\n';
  const offsets = [0];
  for (const [index, object] of objects.entries()) {
    offsets.push(Buffer.byteLength(output));
    output += `${index + 1} 0 obj\n${object}\nendobj\n`;
  }
  const xref = Buffer.byteLength(output);
  output += `xref\n0 6\n0000000000 65535 f \n${offsets.slice(1).map(offset => `${String(offset).padStart(10, '0')} 00000 n \n`).join('')}trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return new Blob([output], { type: 'application/pdf' });
}

try {
  const owner = await person('titulado');
  const other = await person('titulado');
  const admin = await person('administrativo');
  const axes = ['desarrollo', 'cloud-devops', 'data-ai', 'qa', 'ciberseguridad', 'gobernanza-ti'];
  for (const id of axes) await db.radarArea.upsert({ where: { id }, create: { id, name: id }, update: {} });
  const skills = {};
  for (const [name, areaId] of [['Python', 'data-ai'], ['Docker', 'cloud-devops'], ['Java', 'desarrollo']]) {
    skills[name] = await db.skill.upsert({ where: { name }, create: { name, areaId, isCustom: false }, update: { areaId, isCustom: false } });
  }
  const radar = () => request('/radar-integration/me', owner.token);
  const nlp = () => request('/profile/skills-for-radar', owner.token);
  const save = ids => request('/profile/me/skills', owner.token, 'PUT', { skillIds: ids });
  const approve = async name => {
    const row = await db.userSkill.findUniqueOrThrow({ where: { userId_skillId: { userId: owner.id, skillId: skills[name].id } } });
    return request(`/radar-integration/admin/reviews/skill/${row.id}`, admin.token, 'PATCH', { decision: 'approved' });
  };
  let experience;
  let cv;
  await check('legacy publication and document bytes remain intact without schema changes', async () => {
      const legacy = await person('titulado');
      const legacyId = legacy.id;
      await db.userSkill.create({ data: { userId: legacyId, skillId: skills.Python.id, source: 'manual', verificationStatus: 'approved' } });
      const original = scoreVerifiedSkills([{ id: skills.Python.id, name: 'Python', areaId: 'data-ai', isHighRelevance: false, evidenceRefs: [] }]);
      await db.$executeRaw`INSERT INTO radar_score_snapshots (user_id,version,rubric_version,fingerprint,scores,evidence,average_score)
        VALUES (${legacyId}::uuid,7,${RUBRIC_VERSION},${original.fingerprint},${JSON.stringify(original.scores)}::jsonb,${JSON.stringify(original.evidence)}::jsonb,${original.average})`;
      await db.certification.create({ data: { userId: legacyId, name: 'Historical certificate', issuingOrganization: 'QA', issueDate: new Date('2024-01-01'), documentUrl: new Uint8Array([1, 2, 3]) } });
      const service = app.get(RadarIntegrationService);
      const before = await service.myRadar(legacyId);
      assert.equal(before.sourceRevision, null);
      assert.equal(before.processingStatus, 'pending');
      const files = await db.certification.findMany({ where: { userId: legacyId }, select: { id: true, documentUrl: true } });
      assert.ok(files.length > 0);
      await service.retry(legacyId);
      const after = await service.myRadar(legacyId);
      assert.equal(after.version, before.version);
      assert.deepEqual(after.scores, before.scores);
      assert.equal(after.processingStatus, 'ready');
      assert.equal(after.skills[0].name, 'Python');
      const preserved = await db.certification.findUniqueOrThrow({ where: { id: files[0].id } });
      assert.deepEqual(preserved.documentUrl, files[0].documentUrl);
      assert.equal((await request('/certifications', legacy.token))[0].hasDocument, true);
    });
  await check('personal information and presentation, including job interests, persist on reload', async () => {
    const city = await db.city.upsert({ where: { title: 'Ciudad QA' }, create: { title: 'Ciudad QA' }, update: {} });
    await request('/profile/me/personal-info', owner.token, 'PATCH', { firstName: 'Titular QA', lastName: 'Local', cityId: city.id, phone: '+59170000000', personalEmail: 'personal@example.test' });
    await request('/profile/me/presentation', owner.token, 'PATCH', { headline: 'Profesional de calidad', aboutMe: 'Especialista en calidad. Busco oportunidades laborales remotas.' });
    const profile = await request('/profile/me', owner.token);
    assert.equal(profile.personalEmail, 'personal@example.test');
    assert.equal(profile.headline, 'Profesional de calidad');
    assert.match(profile.aboutMe, /oportunidades laborales remotas/);
    await request('/profile/me/personal-info', owner.token, 'PATCH', { firstName: '', lastName: '', cityId: city.id, phone: 'bad', personalEmail: 'bad' }, 400);
    assert.equal((await request('/profile/me', owner.token)).personalEmail, profile.personalEmail);
  });
  await check('empty profile, zero CV count, authenticated six-axis radar', async () => {
    const files = await request('/profile/me/cvs', owner.token);
    assert.deepEqual(files.items, []);
    assert.equal(files.totalItems, 0);
    assert.deepEqual(Object.values((await radar()).scores), [0, 0, 0, 0, 0, 0]);
    await request('/radar-integration/me', null, 'GET', undefined, 401);
    await request('/radar-integration/admin/queue', owner.token, 'GET', undefined, 403);
  });
  await check('manual save triggers NLP and publishes without scoring pending skills', async () => {
    await save([skills.Python.id]);
    assert.equal((await nlp()).status, 'ready');
    const result = await radar();
    assert.equal(result.processingStatus, 'ready');
    assert.equal(result.scores['data-ai'], 0);
    assert.equal(result.pending, 1);
  });
  await check('administrative approval is persisted, scored and idempotent', async () => {
    await approve('Python');
    const first = await radar();
    assert.equal(first.scores['data-ai'], 1);
    await approve('Python');
    assert.equal((await radar()).version, first.version);
    const [decisions] = await db.$queryRaw`SELECT count(*)::int AS count FROM radar_audit_events WHERE user_id=${owner.id}::uuid AND event_type='skill.approved'`;
    assert.equal(decisions.count, 1);
  });
  await check('a pending CV does not remove an already approved manual contribution', async () => {
    const form = new FormData(); form.set('file', pdf('Python'), 'pending-manual-proof.pdf');
    const pending = await request('/profile/me/cvs', owner.token, 'POST', form, 201);
    assert.equal((await radar()).scores['data-ai'], 1);
    await request(`/profile/me/cvs/${pending.id}`, owner.token, 'DELETE');
    assert.equal((await radar()).scores['data-ai'], 1);
  });
  await check('experience change updates approved relevance and leaves detections pending', async () => {
    experience = await request('/work-experiences', owner.token, 'POST', { companyName: 'QA Local', position: 'Backend developer', startDate: '2024-01-01', endDate: null, isCurrent: true, description: 'Desarrollo con Python y Docker' }, 201);
    const result = await radar();
    assert.equal(result.scores['data-ai'], 1.5);
    assert.equal(result.scores['cloud-devops'], 0);
    assert.equal((await nlp()).skills.filter(s => s.name === 'Python').length, 1);
    await approve('Docker');
    assert.equal((await radar()).scores['cloud-devops'], 1.5);
  });
  await check('editing and deleting sources removes stale approved contributions automatically', async () => {
    await request(`/work-experiences/${experience.id}`, owner.token, 'PATCH', { description: 'Desarrollo con Java' });
    const result = await radar();
    assert.equal(result.scores['cloud-devops'], 0);
    assert.equal(result.scores['data-ai'], 1);
    assert.ok(!(await nlp()).skills.some(s => s.name === 'Docker'));
    assert.ok(!result.skills.some(s => s.name === 'Docker'));
    await request(`/work-experiences/${experience.id}`, owner.token, 'DELETE');
    await save([]);
    assert.ok(Object.values((await radar()).scores).every(value => value === 0));
  });
  await check('education and certification changes participate in the same pipeline', async () => {
    const education = await request('/educations', owner.token, 'POST', { institution: 'UMSS', degree: EDUCATION_DEGREES[0].degrees[0].name, startDate: '2020-01-01', endDate: '2024-01-01', description: 'Desarrollo con Docker' }, 201);
    assert.ok((await nlp()).skills.some(s => s.name === 'Docker'));
    await request(`/educations/${education.id}`, owner.token, 'DELETE');
    assert.ok(!(await nlp()).skills.some(s => s.name === 'Docker'));
    const certification = await request('/certifications', owner.token, 'POST', { name: 'Python', issuingOrganization: 'QA Local', issueDate: '2024-01-01' }, 201);
    assert.ok((await nlp()).skills.some(s => s.name === 'Python'));
    const attachment = new FormData(); attachment.set('file', pdf('Python'), 'qa-certificate.pdf');
    await request(`/certifications/${certification.id}/document`, owner.token, 'PUT', attachment);
    const ownFile = await fetch(`${base}/certifications/${certification.id}/document`, { headers: { Authorization: `Bearer ${owner.token}` } });
    assert.equal(ownFile.status, 200);
    assert.equal(ownFile.headers.get('content-type'), 'application/pdf');
    const storedCertificate = (await request('/certifications', owner.token)).find(row => row.id === certification.id);
    assert.equal(storedCertificate.document.fileName, 'qa-certificate.pdf');
    assert.equal(storedCertificate.document.mimeType, 'application/pdf');
    assert.ok(storedCertificate.document.sizeBytes > 0);
    const foreignFile = await fetch(`${base}/certifications/${certification.id}/document`, { headers: { Authorization: `Bearer ${other.token}` } });
    assert.ok([403, 404].includes(foreignFile.status));
    await approve('Python');
    assert.equal((await radar()).scores['data-ai'], 1.5);
    await request(`/certifications/${certification.id}/document`, owner.token, 'DELETE');
    assert.equal((await radar()).scores['data-ai'], 0);
    await request(`/certifications/${certification.id}`, owner.token, 'DELETE');
    assert.ok(!(await nlp()).skills.some(s => s.name === 'Python'));
  });
  await check('certification fields and attachment save atomically and metadata survives a new login', async () => {
    const values = { name: 'Python Atomic', issuingOrganization: 'QA Local', issueDate: '2024-01-01' };
    const body = (fields, action, attachment) => {
      const form = new FormData();
      for (const [key, value] of Object.entries(fields)) form.set(key, value);
      form.set('documentAction', action);
      if (attachment) form.set('file', attachment, 'atomic-proof.pdf');
      return form;
    };
    const count = await db.certification.count({ where: { userId: owner.id } });
    await request('/certifications/with-document', owner.token, 'POST', body(values, 'replace'), 400);
    assert.equal(await db.certification.count({ where: { userId: owner.id } }), count);
    const created = await request('/certifications/with-document', owner.token, 'POST', body(values, 'replace', pdf('Python')), 201);
    assert.equal(created.hasDocument, true);
    assert.equal(created.document.fileName, 'atomic-proof.pdf');
    const persisted = await db.certification.findUniqueOrThrow({ where: { id: created.id } });
    await request(`/certifications/${created.id}/with-document`, owner.token, 'PATCH', body({ ...values, name: 'Invalid partial edit' }, 'replace'), 400);
    const unchanged = await db.certification.findUniqueOrThrow({ where: { id: created.id } });
    assert.equal(unchanged.name, persisted.name);
    assert.deepEqual(unchanged.documentUrl, persisted.documentUrl);
    const fresh = await request('/auth/login', null, 'POST', { email: owner.email, password, roleTag: owner.roleName }, 201);
    const reloaded = (await request('/certifications', fresh.accessToken)).find(row => row.id === created.id);
    assert.deepEqual(reloaded.document, created.document);
    const updated = await request(`/certifications/${created.id}/with-document`, owner.token, 'PATCH', body({ ...values, name: 'Python Updated' }, 'replace', pdf('Python')));
    assert.equal(updated.name, 'Python Updated');
    assert.equal(updated.hasDocument, true);
    const removed = await request(`/certifications/${created.id}/with-document`, owner.token, 'PATCH', body(values, 'remove'));
    assert.equal(removed.hasDocument, false);
    assert.equal(removed.document, undefined);
    await request(`/certifications/${created.id}`, owner.token, 'DELETE');
  });
  await check('a late old analysis cannot overwrite the latest publication', async () => {
    const sources = app.get(ProfileSkillSourcesRepository);
    const original = sources.findTextSources.bind(sources);
    let release;
    let entered;
    const held = new Promise(resolve => { release = resolve; });
    const started = new Promise(resolve => { entered = resolve; });
    let first = true;
    sources.findTextSources = async id => {
      if (id === owner.id && first) { first = false; entered(); await held; }
      return original(id);
    };
    const old = save([skills.Python.id]);
    try {
      await started;
      await save([skills.Java.id]);
      const latest = await radar();
      release();
      await old;
      assert.equal((await radar()).version, latest.version);
      assert.deepEqual((await nlp()).skills.map(s => s.name), ['Java']);
    } finally { release(); sources.findTextSources = original; }
  });
  await check('publication failure preserves saved profile and last snapshot; retry recovers', async () => {
    const last = await radar();
    await db.$executeRawUnsafe(`CREATE FUNCTION epic2_qa_fail_radar() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'QA injected publication failure'; END $$`);
    await db.$executeRawUnsafe(`CREATE TRIGGER epic2_qa_fail_radar BEFORE INSERT ON radar_audit_events FOR EACH ROW WHEN (NEW.user_id='${owner.id}'::uuid AND NEW.event_type IN ('radar.published','radar.synchronized')) EXECUTE FUNCTION epic2_qa_fail_radar()`);
    faultInstalled = true;
    await save([skills.Python.id]);
    const failed = await radar();
    assert.equal(failed.processingStatus, 'error');
    assert.equal(failed.version, last.version);
    assert.deepEqual(failed.scores, last.scores);
    assert.deepEqual(failed.skills, last.skills);
    assert.deepEqual((await nlp()).skills.map(s => s.name), ['Python']);
    await db.$executeRawUnsafe('DROP TRIGGER epic2_qa_fail_radar ON radar_audit_events');
    await db.$executeRawUnsafe('DROP FUNCTION epic2_qa_fail_radar()');
    faultInstalled = false;
    await request('/radar-integration/me/recalculate', owner.token, 'POST', {} , 201);
    const recovered = await radar();
    assert.equal(recovered.processingStatus, 'ready');
    assert.equal(recovered.sourceRevision, recovered.inputRevision);
  });
  await check('textual CV extraction uses the owner and never approves detections automatically', async () => {
    const form = new FormData(); form.set('file', pdf('Docker Python'), 'qa-cv.pdf');
    cv = await request('/profile/me/cvs', owner.token, 'POST', form, 201);
    const [evidence] = await db.$queryRaw`SELECT extraction_status,review_status FROM radar_cv_evidence WHERE cv_id=${cv.id}::uuid`;
    assert.equal(evidence.extraction_status, 'ready');
    assert.equal(evidence.review_status, 'pending');
    assert.ok((await nlp()).skills.some(s => s.evidenceRefs.some(ref => ref.type === 'cv' && ref.id === cv.id)));
    const response = await fetch(`${base}/profile/me/cvs/${cv.id}/file`, { headers: { Authorization: `Bearer ${other.token}` } });
    assert.equal(response.status, 404);
    assert.equal((await request('/radar-integration/me', other.token)).version, 0);
  });
  await check('unreadable current CV never falls back to an older textual CV', async () => {
    const form = new FormData(); form.set('file', pdf(), 'qa-empty.pdf');
    const current = await request('/profile/me/cvs', owner.token, 'POST', form, 201);
    const snapshot = await nlp();
    assert.ok(!snapshot.skills.some(s => s.evidenceRefs.some(ref => ref.id === cv.id)));
    const [evidence] = await db.$queryRaw`SELECT extraction_status FROM radar_cv_evidence WHERE cv_id=${current.id}::uuid`;
    assert.equal(evidence.extraction_status, 'unreadable');
    await request(`/profile/me/cvs/${current.id}`, owner.token, 'DELETE');
    await request(`/profile/me/cvs/${cv.id}`, owner.token, 'DELETE');
  });
  await check('duplicate manual ids are rejected without changing the stored selection', async () => {
    await save([skills.Python.id]);
    await request('/profile/me/skills', owner.token, 'PUT', { skillIds: [skills.Java.id, skills.Java.id] }, 409);
    assert.deepEqual((await request('/profile/me/skills', owner.token)).map(s => s.name), ['Python']);
  });
  await check('a fresh login recovers the persisted profile, skills and radar', async () => {
    const login = await request('/auth/login', null, 'POST', { email: owner.email, password, roleTag: owner.roleName }, 201);
    assert.match((await request('/profile/me', login.accessToken)).aboutMe, /oportunidades laborales remotas/);
    assert.deepEqual((await request('/profile/me/skills', login.accessToken)).map(s => s.name), ['Python']);
    assert.deepEqual((await request('/radar-integration/me', login.accessToken)).scores, (await radar()).scores);
  });
  console.log(JSON.stringify({ passed: results.length, results }, null, 2));
} finally {
  if (faultInstalled) {
    await db.$executeRawUnsafe('DROP TRIGGER IF EXISTS epic2_qa_fail_radar ON radar_audit_events');
    await db.$executeRawUnsafe('DROP FUNCTION IF EXISTS epic2_qa_fail_radar()');
  }
  // Remove only users created by this run. Catalog fixtures stay in the disposable DB.
  for (const id of people) await db.user.delete({ where: { id } });
  await app.close();
}
