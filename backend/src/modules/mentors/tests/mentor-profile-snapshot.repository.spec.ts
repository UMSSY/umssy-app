import { describe, expect, it, vi } from 'vitest';
import { MentorsRepository } from '../repositories/mentors.repository.js';
import type { PrismaService } from '../../../common/prisma/prisma.service.js';
import { directoryPredicate } from '../repositories/mentor-directory.queries.js';

describe('minimal mentor profile snapshot query', () => {
  it('uses bound parameters and only returns lengths, description and existence flags', async () => {
    const snapshot = {
      photoByteLength: 3,
      aboutMe: 'Mentora',
      hasTechnicalAreas: true,
      hasWorkExperience: true,
    };
    const queryRaw = vi.fn().mockResolvedValue([snapshot]);
    const repository = new MentorsRepository({
      $queryRaw: queryRaw,
    } as unknown as PrismaService);
    const userId = "id' OR true --";
    const now = new Date('2026-11-13T12:00:00Z');
    expect(await repository.findActiveMentorProfileSnapshot(userId, now)).toBe(
      snapshot,
    );
    expect(queryRaw).toHaveBeenCalledTimes(1);
    const query = queryRaw.mock.calls[0][0];
    expect(query.values).toEqual([userId, now, 'mentor']);
    expect(query.sql).not.toContain(userId);
    expect(query.sql).toContain('octet_length(u.photo_url)');
    expect(query.sql).toContain(
      directoryPredicate({ search: '', available: false }, now).sql,
    );
    expect(query.sql.match(/EXISTS/g)).toHaveLength(3);
    const selected = query.sql.slice(0, query.sql.indexOf('FROM users u'));
    expect(selected.match(/AS "/g)).toHaveLength(4);
    expect(selected.replace('octet_length(u.photo_url)', '')).not.toContain(
      'photo_url',
    );
    for (const forbidden of [
      'certifications',
      'document_url',
      'educations',
      'mentor_orientation_types',
      'SELECT *',
      'is_available_for_mentoring',
    ])
      expect(query.sql).not.toContain(forbidden);
  });

  it('returns null when no active mentor matches', async () => {
    const repository = new MentorsRepository({
      $queryRaw: vi.fn().mockResolvedValue([]),
    } as unknown as PrismaService);
    expect(
      await repository.findActiveMentorProfileSnapshot('user', new Date()),
    ).toBeNull();
  });

  it('propagates database errors without pretending the profile is complete', async () => {
    const error = new Error('database unavailable');
    const repository = new MentorsRepository({
      $queryRaw: vi.fn().mockRejectedValue(error),
    } as unknown as PrismaService);
    await expect(
      repository.findActiveMentorProfileSnapshot('user', new Date()),
    ).rejects.toBe(error);
  });
});
