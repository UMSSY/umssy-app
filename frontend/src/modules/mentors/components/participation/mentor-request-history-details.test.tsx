import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { MentorParticipationHistoryItem } from '../../types/mentor-participation-history.types';
import { MentorRequestHistoryDetails } from './mentor-request-history-details';

const request: MentorParticipationHistoryItem = {
  id: 'request-hu14-001',
  userId: 'user-hu14-001',
  status: 'PENDING',
  queuedAt: '2026-11-10T14:30:00.000Z',
  createdAt: '2026-11-10T14:00:00.000Z',
  updatedAt: '2026-11-11T09:00:00.000Z',
  technicalAreaIds: ['area-1', 'area-2'],
  orientationTypeIds: ['orientation-1'],
  statusId: 'status-pending',
};

const renderDetails = (
  item: MentorParticipationHistoryItem = request,
) =>
  renderToStaticMarkup(
    <MentorRequestHistoryDetails
      request={item}
      technicalAreaNames={['Desarrollo Web', 'Bases de Datos']}
      orientationNames={['Mentoría académica']}
      onClose={() => {}}
    />,
  );

describe('mentor request history details HU14', () => {
  it('muestra el título del detalle con la fecha de la solicitud', () => {
    const html = renderDetails();

    expect(html).toContain('Detalle de la solicitud');
    expect(html).toContain('2026');
  });

  it('muestra los nombres reales de áreas y orientaciones', () => {
    const html = renderDetails();

    expect(html).toContain('Áreas técnicas:');
    expect(html).toContain('Desarrollo Web');
    expect(html).toContain('Bases de Datos');

    expect(html).toContain('Tipos de orientación:');
    expect(html).toContain('Mentoría académica');
  });

  it('muestra la fecha de registro con hora y el estado actual', () => {
    const html = renderDetails();

    expect(html).toContain('Fecha de registro:');
    expect(html).toContain('Estado actual:');
    expect(html).toContain('Pendiente');
  });

  it('muestra el mensaje informativo cuando la solicitud fue aceptada', () => {
    const html = renderDetails({
      ...request,
      status: 'ACTIVE',
    });

    expect(html).toContain('Aceptada');
    expect(html).toContain(
      'Tu solicitud fue aceptada. Ya puedes acceder a las mentorías disponibles.',
    );
    expect(html).toContain('<svg');
  });

  it('no muestra el mensaje de aceptación para otros estados', () => {
    const html = renderDetails();

    expect(html).not.toContain(
      'Tu solicitud fue aceptada. Ya puedes acceder a las mentorías disponibles.',
    );
  });

  it('incluye un botón accesible para cerrar el detalle', () => {
    const html = renderDetails();

    expect(html).toContain(
      'aria-label="Cerrar detalles de la solicitud"',
    );
    expect(html).toContain('Cerrar');
  });

  it('muestra un mensaje cuando la fecha es inválida', () => {
    const html = renderDetails({
      ...request,
      createdAt: 'fecha-invalida',
    });

    expect(html).toContain('Fecha no disponible');
  });
});
