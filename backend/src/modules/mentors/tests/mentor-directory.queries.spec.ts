import { describe, expect, it } from 'vitest';
import { Client } from 'pg';
import { Prisma } from '../../../prisma/client.js';
import {
  directoryPredicate,
  directoryOrder,
} from '../repositories/mentor-directory.queries.js';

const now = new Date('2026-11-04T12:00:00Z');
const predicate = (search: string) =>
  directoryPredicate({ search, available: false }, now);

describe('bounded directory SQL', () => {
  it.each([
    'Jose',
    'José',
    'JOSÉ',
    'Íñigo Muñoz',
    'Güemes Álvarez',
    'Rojas Ana',
  ])(
    'normaliza ambos campos y cada término con la misma expresión: %s',
    (search) => {
      const query = predicate(search);
      const terms = search.split(/\s+/);
      expect(query.sql.match(/strpos\(/g)).toHaveLength(terms.length * 2);
      expect(query.sql.match(/normalize\(/g)).toHaveLength(terms.length * 4);
      expect(query.sql).not.toMatch(/headline|technical_area/);
      for (const term of terms)
        expect(query.values.filter((value) => value === term)).toHaveLength(2);
      expect(query.sql).toContain('u.first_name');
      expect(query.sql).toContain('u.last_name');
    },
  );

  it.each(['', '   '])(
    'omite comparaciones para entrada vacía: %s',
    (search) => {
      expect(predicate(search).sql).not.toContain('strpos');
    },
  );

  it('el tamaño depende linealmente de términos, sin variantes por carácter', () => {
    const short = predicate('u'.repeat(20));
    const long = predicate('u'.repeat(100));
    expect(long.sql).toBe(short.sql);
    expect(long.values).toHaveLength(8);
    expect(
      JSON.stringify(long.values).length - JSON.stringify(short.values).length,
    ).toBe(160);
    const many = predicate(Array(50).fill('u').join(' '));
    expect(many.sql.match(/strpos\(/g)).toHaveLength(100);
    expect(many.values).toHaveLength(302);
    expect(many.sql.length).toBeLessThan(30000);
  });

  it.each(["%' OR true --", '_', '\\', '.*[a-z]+', "O'Connor"])(
    'parametriza caracteres especiales como texto literal: %s',
    (search) => {
      const query = predicate(search);
      expect(query.sql).not.toContain(' LIKE ');
      expect(query.sql).not.toContain(`'${search}'`);
      expect(query.values).toContain(search.split(/\s+/)[0]);
    },
  );

  it('conserva rol activo, disponibilidad y filtros de catálogos', () => {
    const query = directoryPredicate(
      {
        search: 'Ana',
        available: true,
        area: 'Backend',
        orientation: 'Técnica',
      },
      now,
    );
    expect(query.sql).toContain('u.is_active = true');
    expect(query.sql).toContain('ur.deleted_at IS NULL');
    expect(query.sql).toContain('ur.start_at <= ?');
    expect(query.sql).toContain('u.is_available_for_mentoring = true');
    expect(query.sql).toContain('ot.is_active = true');
    expect(query.values).toContain('Backend');
    expect(query.values).toContain('Técnica');
  });
});

// Opt-in only: never fall back to the application's database credentials.
const isolatedUrl = process.env.MENTOR_DIRECTORY_TEST_DATABASE_URL;
describe.skipIf(!isolatedUrl)(
  'PostgreSQL directory semantics (isolated, read-only)',
  () => {
    it('mantiene filtros, visibilidad, orden, conteo y páginas bajo consultas concurrentes', async () => {
      const fixture = Prisma.sql`WITH users AS (
        SELECT *, '2026-01-01'::timestamptz AS created_at FROM (VALUES
          ('a', 'José', 'Pérez', true, true),
          ('b', 'Jose', 'Alvarez', true, false),
          ('c', 'Jose', 'Rojas', false, true),
          ('d', 'Jose', 'Díaz', true, true)
        ) v(id, first_name, last_name, is_active, is_available_for_mentoring)
      ), roles AS (SELECT 'role' AS id, 'mentor' AS name),
      user_roles AS (SELECT id AS user_id, 'role' AS role_id,
        NULL::timestamptz AS deleted_at, '2020-01-01'::timestamptz AS start_at
        FROM users WHERE id <> 'd'),
      technical_areas AS (SELECT 'area' AS id, 'Backend' AS name),
      mentor_technical_areas AS (SELECT id AS mentor_id, 'area' AS technical_area_id FROM users),
      orientation_types AS (SELECT 'orientation' AS id, 'Técnica' AS name, true AS is_active),
      mentor_orientation_types AS (SELECT id AS mentor_id, 'orientation' AS orientation_type_id FROM users)`;
      const execute = async (query: Prisma.Sql) => {
        const client = new Client({ connectionString: isolatedUrl });
        await client.connect();
        try {
          return (await client.query(query.text, query.values)).rows;
        } finally {
          await client.end();
        }
      };
      const filters = {
        search: 'JOSE',
        area: 'Backend',
        orientation: 'Técnica',
        available: false,
      };
      const where = directoryPredicate(filters, now);
      const [count, first, second, available, wrongArea, wrongOrientation] =
        await Promise.all([
          execute(
            Prisma.sql`${fixture} SELECT count(*)::int AS total FROM users u WHERE ${where}`,
          ),
          execute(
            Prisma.sql`${fixture} SELECT id FROM users u WHERE ${where} ORDER BY ${directoryOrder('name_desc')} LIMIT 1 OFFSET 0`,
          ),
          execute(
            Prisma.sql`${fixture} SELECT id FROM users u WHERE ${where} ORDER BY ${directoryOrder('name_desc')} LIMIT 1 OFFSET 1`,
          ),
          execute(
            Prisma.sql`${fixture} SELECT id FROM users u WHERE ${directoryPredicate({ ...filters, available: true }, now)}`,
          ),
          execute(
            Prisma.sql`${fixture} SELECT id FROM users u WHERE ${directoryPredicate({ ...filters, area: 'missing' }, now)}`,
          ),
          execute(
            Prisma.sql`${fixture} SELECT id FROM users u WHERE ${directoryPredicate({ ...filters, orientation: 'missing' }, now)}`,
          ),
        ]);
      expect(count).toEqual([{ total: 2 }]);
      expect([...first, ...second]).toHaveLength(count[0].total);
      expect(first).toEqual([{ id: 'a' }]);
      expect(second).toEqual([{ id: 'b' }]);
      expect(available).toEqual([{ id: 'a' }]);
      expect(wrongArea).toEqual([]);
      expect(wrongOrientation).toEqual([]);
    });
    it.each([
      ['Jose', 'José', 'Pérez', true],
      ['José', 'Jose', 'Perez', true],
      ['JOSÉ', 'josé', 'pérez', true],
      ['inigo munoz', 'Íñigo', 'Muñoz', true],
      ['guemes alvarez', 'Güemes', 'Álvarez', true],
      ['Perez Jose', 'José', 'Pérez', true],
      ['Jose', 'Jose\u0301', 'Perez', true],
      ['', 'Ana', 'Rojas', true],
      ['missing', 'Ana', 'Rojas', false],
      ['u'.repeat(20), 'Ana', 'Rojas', false],
      ['u'.repeat(100), 'Ana', 'Rojas', false],
      ['%', 'Ana', 'Rojas', false],
      ['_', 'Ana', 'Rojas', false],
      ['\\', 'Ana', 'Rojas', false],
      ["O'Connor", 'Ana', "O'Connor", true],
      ['.*', 'Ana', 'Rojas', false],
    ])('busca %s en %s %s', async (search, firstName, lastName, matches) => {
      const client = new Client({ connectionString: isolatedUrl });
      await client.connect();
      try {
        const query = predicate(search);
        const first = query.values.length + 1;
        const result = await client.query(
          `WITH
        users AS (SELECT 'mentor-id' AS id, true AS is_active,
          $${first}::text AS first_name, $${first + 1}::text AS last_name),
        roles AS (SELECT 'role-id' AS id, 'mentor' AS name),
        user_roles AS (SELECT 'mentor-id' AS user_id, 'role-id' AS role_id,
          NULL::timestamptz AS deleted_at, '2020-01-01'::timestamptz AS start_at)
        SELECT u.id FROM users u WHERE ${query.text}`,
          [...query.values, firstName, lastName],
        );
        expect(result.rows).toHaveLength(matches ? 1 : 0);
      } finally {
        await client.end();
      }
    });
  },
);
