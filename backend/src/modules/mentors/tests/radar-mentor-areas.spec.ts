import { describe, expect, it } from 'vitest';
import { resolveMentorAreas } from '../constants/radar-mentor-areas.constants.js';
describe('radar to mentor specialties', () => {
  it('includes both development specialties without changing the catalog', () => {
    expect(resolveMentorAreas('Desarrollo')).toEqual(expect.arrayContaining(['Backend', 'Desarrollo Web']));
    expect(resolveMentorAreas('Cloud/DevOps')).toContain('Cloud');
    expect(resolveMentorAreas('Data/AI')).toContain('Datos');
  });
  it('does not invent unrelated specialties or remove exact catalog filters', () => {
    expect(resolveMentorAreas('Ciberseguridad')).toEqual(['Ciberseguridad']);
    expect(resolveMentorAreas('Gobernanza TI')).toEqual(['Gobernanza TI']);
    expect(resolveMentorAreas('Bases de Datos')).toEqual(['Bases de Datos']);
  });
});
