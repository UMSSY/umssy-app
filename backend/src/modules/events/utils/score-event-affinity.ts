import { RADAR_AREAS } from '../../profile/constants/radar-areas.constants.js';
import {
  AFFINITY_WEIGHTS,
  INTEREST_MATCH_SATURATION,
  INTERESTS_REASON,
  POPULARITY_WEIGHT,
  RADAR_AREA_KEYWORDS,
  RADAR_MAX_SCORE,
  SKILL_MATCH_SATURATION,
} from '../constants/event-affinity.constants.js';
import type { AffinitySignalKey } from '../types/affinity-signal-key.types.js';
import type { AffinitySignalMatch } from '../types/affinity-signal-match.types.js';
import type { AffinitySignals } from '../types/affinity-signals.types.js';
import type { EventAffinityMatch } from '../types/event-affinity-match.types.js';
import type { EventWithRelations } from '../types/events.types.js';
import {
  containsPhrase,
  extractKeywords,
  normalizeAffinityText,
} from './affinity-text.js';


function scoreSkills(text: string, skills: string[]): AffinitySignalMatch {
  const matched = skills.filter((skill) => containsPhrase(text, skill));
  return {
    value: Math.min(1, matched.length / SKILL_MATCH_SATURATION),
    reasons: matched,
  };
}

function scoreRadar(
  text: string,
  scores: AffinitySignals['radarScores'],
): AffinitySignalMatch {
  const matched = RADAR_AREAS.filter(
    ({ id }) =>
      (scores[id] ?? 0) > 0 &&
      RADAR_AREA_KEYWORDS[id].some((keyword) => containsPhrase(text, keyword)),
  );
  const best = Math.max(0, ...matched.map(({ id }) => scores[id] ?? 0));
  return {
    value: Math.min(1, best / RADAR_MAX_SCORE),
    reasons: matched.map(({ name }) => name),
  };
}

function scoreCareers(text: string, careers: string[]): AffinitySignalMatch {
  const matches = careers.map((career) => {
    const keywords = extractKeywords(career);
    const hits = keywords.filter((keyword) => containsPhrase(text, keyword));
    return { career, value: keywords.length ? hits.length / keywords.length : 0 };
  });
  const matched = matches.filter(({ value }) => value > 0);
  return {
    value: Math.max(0, ...matched.map(({ value }) => value)),
    reasons: matched.map(({ career }) => career),
  };
}

function scoreInterests(text: string, interests: string): AffinitySignalMatch {
  const hits = extractKeywords(interests).filter((keyword) =>
    containsPhrase(text, keyword),
  );
  return {
    value: Math.min(1, hits.length / INTEREST_MATCH_SATURATION),
    reasons: hits.length ? [INTERESTS_REASON] : [],
  };
}

function availableSignals(signals: AffinitySignals): AffinitySignalKey[] {
  const available: Record<AffinitySignalKey, boolean> = {
    skills: signals.skills.length > 0,
    radar: Object.keys(signals.radarScores).length > 0,
    career: signals.careers.length > 0,
    interests: extractKeywords(signals.interests).length > 0,
  };
  return (Object.keys(available) as AffinitySignalKey[]).filter(
    (key) => available[key],
  );
}

export function hasAffinitySignals(signals: AffinitySignals): boolean {
  return availableSignals(signals).length > 0;
}

export function scoreEventAffinity(
  event: EventWithRelations,
  signals: AffinitySignals,
): EventAffinityMatch {
  const keys = availableSignals(signals);
  const totalWeight = keys.reduce((sum, key) => sum + AFFINITY_WEIGHTS[key], 0);
  if (totalWeight === 0) return { affinity: 0, reasons: [] };

  const text = normalizeAffinityText(
    [event.title, event.description ?? '', event.category.name].join(' '),
  );
  const matches: Record<AffinitySignalKey, () => AffinitySignalMatch> = {
    skills: () => scoreSkills(text, signals.skills),
    radar: () => scoreRadar(text, signals.radarScores),
    career: () => scoreCareers(text, signals.careers),
    interests: () => scoreInterests(text, signals.interests),
  };
  const affinityShare = 1 - POPULARITY_WEIGHT;

  return keys.reduce<EventAffinityMatch>(
    (result, key) => {
      const match = matches[key]();
      return {
        affinity:
          result.affinity +
          (match.value * AFFINITY_WEIGHTS[key] * affinityShare) / totalWeight,
        reasons: [...new Set([...result.reasons, ...match.reasons])],
      };
    },
    { affinity: 0, reasons: [] },
  );
}
