import { describe, expect, it } from 'vitest';
import { isProfilePhotoMissing } from '../utils/mentor-profile-completeness.js';
import { buildMentorProfile } from './fixtures/mentor-profile.fixture.js';

describe('isProfilePhotoMissing', () => {
  it.each([
    [null, true],
    [0, true],
    [3, false],
  ] as const)(
    'evaluates a projected byte length %s without loading the photo',
    (length, missing) => expect(isProfilePhotoMissing(length)).toBe(missing),
  );
  it('detects an absent photo', () => {
    expect(isProfilePhotoMissing(null)).toBe(true);
  });
  it('detects empty binary content', () => {
    expect(isProfilePhotoMissing(new Uint8Array())).toBe(true);
    expect(isProfilePhotoMissing(Buffer.alloc(0))).toBe(true);
  });
  it('accepts present photo content', () => {
    expect(isProfilePhotoMissing(buildMentorProfile().photoUrl)).toBe(false);
    expect(isProfilePhotoMissing(Buffer.from([0xff, 0xd8, 0xff]))).toBe(false);
  });
  it('preserves the photo bytes', () => {
    const photo = buildMentorProfile().photoUrl!;
    const before = photo.slice();
    isProfilePhotoMissing(photo);
    expect(photo).toEqual(before);
  });
});
