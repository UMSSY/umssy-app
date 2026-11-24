import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ExternalRepositoryMapper } from '../mappers/external-repository.mapper.js';

describe('ExternalRepositoryMapper', () => {
  const mapper = new ExternalRepositoryMapper();
  const now = '2026-11-15T12:00:00.000Z';

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(now));
  });
  afterEach(() => vi.useRealTimers());

  it('keeps only public GitHub repositories and normalizes ownership, optional text and offset dates', () => {
    const result = mapper.fromGitHub([
      { name: ' private ', private: true },
      {
        name: ' project ', html_url: ' https://github.com/Ana/project ',
        description: ' Description ', language: ' TypeScript ', stargazers_count: 4,
        owner: { login: 'ANA' }, updated_at: '2026-11-10T10:30:00-04:00',
      },
      {},
    ], 'ana');
    expect(result).toEqual([
      {
        provider: 'github', repoName: 'project', repoUrl: 'https://github.com/Ana/project',
        description: 'Description', language: 'TypeScript', starsCount: 4, isOwner: true,
        updatedAt: '2026-11-10T14:30:00.000Z',
      },
      {
        provider: 'github', repoName: '', repoUrl: '', description: null, language: null,
        starsCount: 0, isOwner: false, updatedAt: now,
      },
    ]);
  });

  it('replaces invalid GitHub dates with the current time and preserves contributions as non-owner', () => {
    expect(mapper.fromGitHub([{ owner: { login: 'other' }, updated_at: 'bad-date' }], 'ana')[0])
      .toMatchObject({ isOwner: false, updatedAt: now });
  });

  it('filters non-public GitLab projects, handles both ownership signals and prioritizes activity dates', () => {
    const result = mapper.fromGitLab([
      { visibility: 'private' },
      { visibility: 'internal' },
      {
        name: ' Project ', web_url: ' https://gitlab.com/ana/project ', description: ' Info ',
        visibility: 'PUBLIC', namespace: { kind: 'user' }, star_count: 7,
        last_activity_at: '2026-11-11T12:00:00Z', updated_at: '2020-01-01T00:00:00Z',
      },
      { namespace: { path: 'ANA', kind: 'group' }, updated_at: '2026-11-12T12:00:00Z' },
      { namespace: { kind: 'group', path: 'other' }, last_activity_at: 'invalid' },
    ], 'ana');
    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({
      provider: 'gitlab', repoName: 'Project', repoUrl: 'https://gitlab.com/ana/project',
      description: 'Info', language: null, starsCount: 7, isOwner: true,
      updatedAt: '2026-11-11T12:00:00.000Z',
    });
    expect(result[1]).toMatchObject({ isOwner: true, updatedAt: '2026-11-12T12:00:00.000Z' });
    expect(result[2]).toMatchObject({ isOwner: false, starsCount: 0, updatedAt: now });
  });

  it('does not infer ownership from an empty GitLab username or missing namespace', () => {
    expect(mapper.fromGitLab([{ namespace: { path: 'ana' } }, {}], '').every(project => !project.isOwner)).toBe(true);
  });
});
