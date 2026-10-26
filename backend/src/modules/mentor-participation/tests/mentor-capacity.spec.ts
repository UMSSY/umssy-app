import { describe, expect, it } from 'vitest';
import { mentorCapacity } from '../services/mentor-capacity.js';

describe('política HU7 de capacidad', () => {
  it('no habilita cupos si no hay titulados aprobados', () => {
    expect(mentorCapacity(0, 40, 0, 0)).toMatchObject({ capacity: 0, available: 0 });
  });

  it('redondea 25 titulados al tope 10 y cuenta exactamente una reserva', () => {
    expect(mentorCapacity(25, 40, 9, 1)).toMatchObject({ capacity: 10, occupied: 10, available: 0 });
  });

  it('conserva sobreocupación histórica sin publicar cupos negativos', () => {
    expect(mentorCapacity(10, 40, 6, 0)).toMatchObject({ capacity: 4, occupied: 6, available: 0 });
  });
});
