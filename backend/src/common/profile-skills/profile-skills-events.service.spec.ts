import { Logger } from '@nestjs/common';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ProfileSkillsEvents } from './profile-skills-events.service.js';

const publication = { userId: 'person', inputRevision: 3, resultVersion: 2 };

afterEach(() => vi.restoreAllMocks());

describe('ProfileSkillsEvents', () => {
  it('awaits consumers before completing the publication', async () => {
    const events = new ProfileSkillsEvents();
    let release!: () => void;
    let complete = false;
    const ready = new Promise<void>(resolve => { release = resolve; });
    events.subscribe(async value => { expect(value).toEqual(publication); await ready; });
    const pending = events.published(publication).then(() => { complete = true; });
    await Promise.resolve();
    expect(complete).toBe(false);
    release();
    await pending;
    expect(complete).toBe(true);
  });

  it('isolates a failed radar consumer from the already committed NLP result', async () => {
    vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    const events = new ProfileSkillsEvents();
    const other = vi.fn().mockResolvedValue(undefined);
    events.subscribe(async () => { throw new Error('database unavailable'); });
    events.subscribe(other);
    await expect(events.published(publication)).resolves.toBeUndefined();
    expect(other).toHaveBeenCalledWith(publication);
  });

  it('unsubscribes the consumer on module destruction', async () => {
    const events = new ProfileSkillsEvents();
    const callback = vi.fn().mockResolvedValue(undefined);
    const unsubscribe = events.subscribe(callback);
    unsubscribe();
    await events.published(publication);
    expect(callback).not.toHaveBeenCalled();
  });
});
