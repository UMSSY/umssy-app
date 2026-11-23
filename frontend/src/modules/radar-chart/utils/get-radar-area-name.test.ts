import { describe, expect, it } from 'vitest';
import { getRadarAreaName } from './get-radar-area-name';

describe('Radar area labels', () => {
  it('uses the catalog label and preserves unknown identifiers for traceability', () => {
    expect(getRadarAreaName('cloud-devops')).toBe('Cloud/DevOps');
    expect(getRadarAreaName('future-area')).toBe('future-area');
  });
});
