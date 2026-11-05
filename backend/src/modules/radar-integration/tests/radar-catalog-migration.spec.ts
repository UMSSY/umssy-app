import { RadarPublicationRepository } from '../repositories/radar-publication.repository.js';
import { CertificationRecordsService } from '../../certifications/services/certification-records.service.js';
import type { CertificationsRepository } from '../../certifications/repositories/certifications.repository.js';
import type { RadarAuditService } from '../radar-audit.service.js';
import { TransactionService } from '../../../common/prisma/transaction.service.js';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../../common/prisma/prisma.service.js';
import type { TransactionContext } from '../../../common/types/transaction-context.types.js';
import { RadarCvRepository } from '../repositories/radar-cv.repository.js';
import { RadarReviewRepository } from '../repositories/radar-review.repository.js';
import { RadarEvidenceSourcesRepository } from '../radar-evidence-sources.repository.js';

const owner = '11111111-1111-4111-8111-111111111111';
const cv = '22222222-2222-4222-8222-222222222222';
const otherCv = '33333333-3333-4333-8333-333333333333';
const migration = '20261105050000_radar_catalog_states_audit';
let database: PGlite;

async function migrate(name: string) {
  await database.exec(
    await readFile(
      new URL(
        `../../../../prisma/migrations/${name}/migration.sql`,
        import.meta.url,
      ),
      'utf8',
    ),
  );
}

async function setup() {
  database = new PGlite();
  await database.exec(`
    CREATE TABLE users (id UUID PRIMARY KEY,first_name TEXT,last_name TEXT);
    CREATE TABLE companies (id UUID PRIMARY KEY);
    CREATE TABLE job_offers (id UUID PRIMARY KEY);
    CREATE TABLE user_cv_file (id UUID PRIMARY KEY,user_id UUID,cv_uploaded_at TIMESTAMPTZ,cv_file_name TEXT);
    INSERT INTO users VALUES ('${owner}','Ana','Tola');
    INSERT INTO user_cv_file VALUES ('${cv}','${owner}','2025-01-01','cv.pdf');
  `);
  await migrate('20261025210000_epic3_integration');
  await database.exec(`
    UPDATE radar_cv_evidence SET extraction_status='ready',review_status='approved',
      extracted_text='Python',decided_at='2025-02-01',reviewer_id='${owner}';
    INSERT INTO radar_score_snapshots VALUES ('${owner}',1,'test','fingerprint','{}','{}',5,'2025-02-02');
    INSERT INTO radar_audit_events (user_id,event_type,occurred_at) VALUES ('${owner}','cv.approved','2025-02-01');
  `);
  await migrate('20261105011321_pr1919_radar_catalogos_uuid');
}

// Ejecuta las consultas parametrizadas reales de los repositorios contra PostgreSQL embebido.
function client() {
  return {
    async $queryRaw(parts: TemplateStringsArray, ...values: unknown[]) {
      const sql = parts.reduce(
        (text, part, index) => text + (index ? `$${index}` : '') + part,
        '',
      );
      return (await database.query(sql, values)).rows;
    },
  } as unknown as PrismaService;
}

afterEach(async () => {
  await database?.close();
});

describe('Migración de catálogos y auditoría del Radar', () => {
  it('conserva estados y fechas de registros anteriores y corrige FKs nulas o desactualizadas', async () => {
    await setup();
    await database.exec(`UPDATE radar_cv_evidence SET extraction_status_id=NULL,
      review_status_id=(SELECT id FROM radar_cv_review_statuses WHERE title='pending')`);
    await migrate(migration);
    const { rows } =
      await database.query(`SELECT e.*,x.title AS extraction,r.title AS review
      FROM radar_cv_evidence e JOIN radar_cv_extraction_statuses x ON x.id=e.extraction_status_id
      JOIN radar_cv_review_statuses r ON r.id=e.review_status_id`);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      cv_id: cv,
      extraction: 'ready',
      review: 'approved',
      extracted_text: 'Python',
      created_at: new Date('2025-01-01'),
      updated_at: new Date('2025-02-01'),
    });
    expect(rows[0]).not.toHaveProperty('review_status');
    expect(rows[0]).not.toHaveProperty('extraction_status');
    expect(
      (
        await database.query(
          'SELECT created_at,updated_at FROM radar_audit_events',
        )
      ).rows[0],
    ).toEqual({
      created_at: new Date('2025-02-01'),
      updated_at: new Date('2025-02-01'),
    });
    expect(
      (await database.query('SELECT updated_at FROM radar_score_snapshots'))
        .rows[0],
    ).toEqual({ updated_at: new Date('2025-02-02') });
  }, 30_000);

  it('impide borrar o cambiar IDs referenciados y rechaza estados ausentes', async () => {
    await setup();
    await migrate(migration);
    for (const table of [
      'radar_cv_extraction_statuses',
      'radar_cv_review_statuses',
    ]) {
      await expect(database.exec(`DELETE FROM ${table}`)).rejects.toThrow();
      await expect(
        database.exec(`UPDATE ${table} SET id=gen_random_uuid()`),
      ).rejects.toThrow();
    }
    await expect(
      database.exec('UPDATE radar_cv_evidence SET review_status_id=NULL'),
    ).rejects.toThrow();
    await expect(
      database.exec(
        'UPDATE radar_cv_evidence SET extraction_status_id=gen_random_uuid()',
      ),
    ).rejects.toThrow();
  }, 30_000);

  it('reprocesa, revisa y consulta utilizando únicamente los catálogos', async () => {
    await setup();
    await migrate(migration);
    const db = client();
    const context: TransactionContext = { client: db };
    const cvs = new RadarCvRepository(db);
    const review = new RadarReviewRepository(db);
    const sources = new RadarEvidenceSourcesRepository(db);
    expect(await cvs.upsertEvidence(owner, cv, 'TypeScript', 'ready')).toEqual([
      { review_status: 'approved' },
    ]);
    expect(await review.listReviewQueue()).toEqual([
      expect.objectContaining({
        review_status: 'approved',
        extraction_status: 'ready',
      }),
    ]);
    expect(await sources.findPublicationCvStates(owner, context)).toEqual([
      { cv_id: cv, review_status: 'approved', extraction_status: 'ready' },
    ]);
    expect(await sources.findCurrentCvText(owner)).toEqual([
      { id: cv, type: 'cv', text: 'TypeScript' },
    ]);
    expect(
      await review.changeCvDecision(owner, cv, 'revoked', context),
    ).toEqual([{ user_id: owner, review_status: 'revoked' }]);
    expect(
      await review.changeCvDecision(owner, cv, 'revoked', context),
    ).toEqual([]);
    expect(await sources.findCurrentCvText(owner)).toEqual([]);
    await database.exec(
      `INSERT INTO user_cv_file VALUES ('${otherCv}','${owner}',now(),'nuevo.pdf')`,
    );
    expect(await cvs.upsertEvidence(owner, otherCv, '', 'unreadable')).toEqual([
      { review_status: 'pending' },
    ]);
    expect(await sources.findCurrentCvText(owner)).toEqual([]);
    const publicationClient = Object.assign(db, {
      profileSkillProcessingState: { findUnique: async () => null },
    });
    const publication = new RadarPublicationRepository(publicationClient);
    const state = await publication.radarState(owner);
    expect(Number(state.pendingDocs[0].count)).toBe(1);
    const { rows } = await database.query(
      'SELECT updated_at>created_at AS changed FROM radar_cv_evidence WHERE cv_id=$1',
      [cv],
    );
    expect(rows[0]).toEqual({ changed: true });
  }, 30_000);
  it('revierte la escritura de una certificación si falla su auditoría dentro de PostgreSQL', async () => {
    await setup();
    await migrate(migration);
    await database.exec(
      'CREATE TABLE certification_write_test (id TEXT PRIMARY KEY)',
    );
    const transactions = new TransactionService({
      $transaction: (
        operation: (client: TransactionContext['client']) => Promise<unknown>,
      ) =>
        database.transaction((tx) =>
          operation({
            $executeRaw: async (_parts: TemplateStringsArray, id: string) =>
              tx.query('INSERT INTO certification_write_test VALUES ($1)', [
                id,
              ]),
          } as unknown as TransactionContext['client']),
        ),
    } as unknown as PrismaService);
    const repository = {
      create: async (
        userId: string,
        _data: unknown,
        _document: unknown,
        context: TransactionContext,
      ) => {
        await context.client
          .$executeRaw`INSERT INTO certification_write_test VALUES (${'certificate'})`;
        return { id: 'certificate', userId };
      },
    } as unknown as CertificationsRepository;
    const audit = {
      saveDocumentMetadata: vi
        .fn()
        .mockRejectedValue(new Error('audit unavailable')),
    };
    const service = new CertificationRecordsService(
      repository,
      audit as unknown as RadarAuditService,
      transactions,
    );
    await expect(
      service.create(
        owner,
        {
          name: 'Curso',
          issuingOrganization: 'Universidad',
          issueDate: new Date(),
        },
        {
          documentUrl: new Uint8Array([1]),
          documentFileName: 'curso.pdf',
          documentMimeType: 'application/pdf',
          documentSizeBytes: 1,
          documentUploadedAt: new Date(),
        },
      ),
    ).rejects.toThrow('audit unavailable');
    expect(
      (await database.query('SELECT * FROM certification_write_test')).rows,
    ).toEqual([]);
  }, 30_000);
});
