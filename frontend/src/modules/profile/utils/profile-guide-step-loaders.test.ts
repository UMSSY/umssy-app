import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const educationStep = () => null;

beforeEach(() => {
  vi.resetModules();
  vi.doMock('@/modules/educations', () => ({
    EducationGuideStep: educationStep,
  }));
});

afterEach(() => {
  vi.doUnmock('@/modules/educations');
});

describe('profile guide step loading', () => {
  it('reuses a single request for repeated and already loaded steps', async () => {
    const { loadProfileGuideStep } =
      await import('./profile-guide-step-loaders');
    const first = loadProfileGuideStep('education');
    const concurrent = loadProfileGuideStep('education');

    expect(concurrent).toBe(first);
    await expect(first).resolves.toEqual({ default: educationStep });
    expect(loadProfileGuideStep('education')).toBe(first);
  });

  it('does not load a domain module for local contact and presentation forms', async () => {
    const importEducation = vi.fn(() => ({
      EducationGuideStep: educationStep,
    }));
    vi.doMock('@/modules/educations', importEducation);
    const { preloadProfileGuideStep } =
      await import('./profile-guide-step-loaders');

    await preloadProfileGuideStep('contact');
    await preloadProfileGuideStep('presentation');

    expect(importEducation).not.toHaveBeenCalled();
  });

  it.each(['foreground', 'speculative'])(
    'allows a new attempt after a %s load failure',
    async (mode) => {
      vi.doMock('@/modules/educations', () => {
        throw new Error('The module could not be downloaded');
      });
      const { loadProfileGuideStep, preloadProfileGuideStep } =
        await import('./profile-guide-step-loaders');

      if (mode === 'foreground') {
        await expect(loadProfileGuideStep('education')).rejects.toThrow();
      } else {
        await expect(
          preloadProfileGuideStep('education'),
        ).resolves.toBeUndefined();
      }
      vi.doMock('@/modules/educations', () => ({
        EducationGuideStep: educationStep,
      }));

      await expect(loadProfileGuideStep('education')).resolves.toEqual({
        default: educationStep,
      });
    },
  );
});
