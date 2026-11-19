import { describe, expect, it } from 'vitest';
import { MentorMapper } from '../mappers/mentor.mapper.js';
import type { MentorProfileSuggestion } from '../types/mentor-profile-suggestion.types.js';

describe('MentorMapper profile suggestions', () => {
  const mapper = new MentorMapper();
  const suggestions = [
    {
      code: 'MISSING_PROFILE_PHOTO',
      field: 'photoUrl',
      message: 'Foto pendiente',
    },
    {
      code: 'MISSING_PROFESSIONAL_DESCRIPTION',
      field: 'aboutMe',
      message: 'Descripción pendiente',
    },
    {
      code: 'MISSING_SPECIALTY',
      field: 'mentorTechnicalAreas',
      message: 'Especialidad pendiente',
    },
    {
      code: 'MISSING_WORK_EXPERIENCE',
      field: 'workExperiences',
      message: 'Experiencia pendiente',
    },
  ] as const satisfies readonly MentorProfileSuggestion[];

  it('preserves input order and messages while adding presentation and the actual count', () => {
    const input = Object.freeze(
      suggestions.map((item) => Object.freeze({ ...item })).reverse(),
    );
    const result = mapper.toProfileSuggestionsResponse(input);
    expect(result.pendingCount).toBe(4);
    expect(result.suggestions.map(({ code }) => code)).toEqual(
      input.map(({ code }) => code),
    );
    result.suggestions.forEach((item, index) => {
      expect(item).toMatchObject(input[index]);
      expect(item.title.length).toBeGreaterThan(0);
      expect(item.benefitDescription.length).toBeGreaterThan(0);
      expect(item.editReference).toEqual({
        section: item.field,
        action: 'edit',
      });
    });
    expect(result.suggestions[0]?.title).toBe(
      'Registra tu experiencia laboral',
    );
    expect(result.suggestions[0]?.benefitDescription).toBe(
      'Muestra la experiencia práctica que puedes compartir en las mentorías.',
    );
  });

  it('returns an empty list and zero for no pending sections', () => {
    expect(mapper.toProfileSuggestionsResponse([])).toEqual({
      suggestions: [],
      pendingCount: 0,
    });
  });

  it('creates independent references without modifying presentation metadata', () => {
    const first = mapper.toProfileSuggestionsResponse(suggestions);
    const second = mapper.toProfileSuggestionsResponse(suggestions);
    expect(first).toEqual(second);
    expect(first.suggestions[0]).not.toBe(second.suggestions[0]);
    expect(first.suggestions[0]?.editReference).not.toBe(
      second.suggestions[0]?.editReference,
    );
  });
});
