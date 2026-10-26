import { describe, expect, it } from 'vitest';
import { mentorDirectoryQuerySchema } from '../requests/mentor-directory-query.schema.js';

describe('mentorDirectoryQuerySchema', () => {
  it('aplica valores predeterminados y recorta la búsqueda', () => {
    expect(mentorDirectoryQuerySchema.parse({ search: '  Ana  ' })).toEqual({
      page: 1,
      search: 'Ana',
      available: false,
      sort: 'name_asc',
    });
  });

  it('convierte una búsqueda de solo espacios en búsqueda vacía', () => {
    expect(mentorDirectoryQuerySchema.parse({ search: '     ' }).search).toBe(
      '',
    );
  });

  it.each(['0', '-1', 'abc', '1.5', '9007199254740992'])(
    'rechaza página inválida %s',
    (page) => {
      expect(mentorDirectoryQuerySchema.safeParse({ page }).success).toBe(
        false,
      );
    },
  );

  it.each([
    { available: 'yes' },
    { sort: 'unknown' },
    { search: 'x'.repeat(101) },
    { search: ['Ana'] },
    { pageSize: '100' },
    { area: '' },
    { orientation: '' },
    { orientation: 'x'.repeat(81) },
  ])('rechaza query inválida %j', (query) => {
    expect(mentorDirectoryQuerySchema.safeParse(query).success).toBe(false);
  });

  it('acepta y recorta el tipo de orientación', () => {
    expect(
      mentorDirectoryQuerySchema.parse({
        orientation: '  Orientación técnica  ',
      }).orientation,
    ).toBe('Orientación técnica');
  });

  it('acepta los valores reservados para dar una respuesta explícita en el servicio', () => {
    expect(mentorDirectoryQuerySchema.parse({ sort: 'affinity' }).sort).toBe(
      'affinity',
    );
    expect(mentorDirectoryQuerySchema.parse({ sort: 'name_desc' }).sort).toBe(
      'name_desc',
    );
  });
});
