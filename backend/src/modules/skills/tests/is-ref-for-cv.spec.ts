import { describe, expect, it } from 'vitest';
import { isRefForCv } from '../utils/is-ref-for-cv.js';

describe('isRefForCv', () => {
  const targetId = 'cv-123';

  it('matches valid cv evidence object with identical id', () => {
    expect(isRefForCv({ type: 'cv', id: targetId }, targetId)).toBe(true);
  });

  it('rejects cv evidence object with different id', () => {
    expect(isRefForCv({ type: 'cv', id: 'cv-999' }, targetId)).toBe(false);
  });

  it('rejects evidence object with different type', () => {
    expect(
      isRefForCv({ type: 'work-experience', id: targetId }, targetId),
    ).toBe(false);
    expect(isRefForCv({ type: 'education', id: targetId }, targetId)).toBe(
      false,
    );
  });

  it('matches plain string representation', () => {
    expect(isRefForCv(targetId, targetId)).toBe(true);
  });

  it('matches prefixed string representation', () => {
    expect(isRefForCv(`cv:${targetId}`, targetId)).toBe(true);
  });

  it('rejects string with different id', () => {
    expect(isRefForCv('cv-other', targetId)).toBe(false);
    expect(isRefForCv('cv:cv-other', targetId)).toBe(false);
  });

  it('rejects invalid or non-object values', () => {
    expect(isRefForCv(null, targetId)).toBe(false);
    expect(isRefForCv(undefined, targetId)).toBe(false);
    expect(isRefForCv(123, targetId)).toBe(false);
    expect(isRefForCv({}, targetId)).toBe(false);
    expect(isRefForCv({ type: 'cv' }, targetId)).toBe(false);
  });

  it('returns false when cvId is empty', () => {
    expect(isRefForCv({ type: 'cv', id: '' }, '')).toBe(false);
    expect(isRefForCv('', '')).toBe(false);
  });
});
