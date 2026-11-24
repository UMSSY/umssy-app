import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { MentorRequestStatusBadge } from './mentor-request-status-badge';

describe('MentorRequestStatusBadge HU14', () => {
  it.each([
    ['ACTIVE', 'Aceptada', 'bg-emerald-50'],
    ['PENDING', 'Pendiente', 'bg-amber-50'],
    ['CANCELLED', 'Cancelada', 'bg-slate-100'],
    ['EXPIRED', 'Vencida', 'bg-red-50'],
  ])(
    'muestra %s como %s con su estilo visual',
    (status, label, expectedClass) => {
      const html = renderToStaticMarkup(
        <MentorRequestStatusBadge status={status} />,
      );

      expect(html).toContain(label);
      expect(html).toContain(expectedClass);
      expect(html).toContain('<svg');
      expect(html).toContain('aria-hidden="true"');
    },
  );
});
