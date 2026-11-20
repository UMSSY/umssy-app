
import { renderWithQuery as render } from '@/shared/testing/render-with-query';
import { cleanup, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { MENTOR_PROFILE_FIXTURE } from '../../testing/mentor-profile.fixture';
import type { MentorProfilePreviewProps } from '../../types/mentor-profile-preview-props.types';
import { MentorProfilePreview } from './mentor-profile-preview';

const { useMentorProfileMock, requestMentorshipMock } = vi.hoisted(() => ({
  useMentorProfileMock: vi.fn(),
  requestMentorshipMock: vi.fn(),
}));

vi.mock('../../hooks/use-mentor-profile', () => ({
  useMentorProfile: useMentorProfileMock,
}));

vi.mock('@/modules/availability', () => ({
  REQUEST_MENTORSHIP_TEXT: {
    disabledHint: 'No está recibiendo solicitudes',
    noSlots: 'Este mentor no tiene horarios disponibles por ahora',
    checkError: 'No se pudieron consultar los horarios disponibles',
  },
  useRequestMentorship: () => ({
    requestMentorship: requestMentorshipMock,
    isChecking: false,
    hasNoSlots: false,
  }),
}));

const onBack = vi.fn();

const defaultProps: MentorProfilePreviewProps = {
  mentorId: MENTOR_PROFILE_FIXTURE.id,
  technicalAreas: MENTOR_PROFILE_FIXTURE.technicalAreas,
  orientationTypes: MENTOR_PROFILE_FIXTURE.orientationTypes,
  onBack,
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('MentorProfilePreview', () => {
  it('muestra el aviso y la etiqueta de vista previa', () => {
    useMentorProfileMock.mockReturnValue({
      data: MENTOR_PROFILE_FIXTURE,
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    });

    render(<MentorProfilePreview {...defaultProps} />);

    expect(screen.getByText('MODO VISTA PREVIA')).toBeVisible();

    expect(
      screen.getByText('Estás viendo una vista previa de tu perfil.'),
    ).toBeVisible();
  });

  it('muestra la información general del mentor', () => {
    useMentorProfileMock.mockReturnValue({
      data: MENTOR_PROFILE_FIXTURE,
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    });

    render(<MentorProfilePreview {...defaultProps} />);

    expect(
      screen.getByRole('heading', {
        name: MENTOR_PROFILE_FIXTURE.fullName,
      }),
    ).toBeVisible();

    expect(screen.getByRole('heading', { name: 'Sobre mí' })).toBeVisible();

    expect(
      screen.getByRole('heading', { name: 'Trayectoria actual' }),
    ).toBeVisible();

    expect(
      screen.getByRole('heading', { name: 'Intereses profesionales' }),
    ).toBeVisible();
  });

  it('muestra las áreas técnicas seleccionadas', () => {
    useMentorProfileMock.mockReturnValue({
      data: MENTOR_PROFILE_FIXTURE,
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    });

    render(<MentorProfilePreview {...defaultProps} />);

    expect(
      screen.getByRole('heading', { name: 'Áreas técnicas' }),
    ).toBeVisible();

    for (const area of defaultProps.technicalAreas) {
      expect(screen.getByText(area.name)).toBeVisible();
    }
  });

  it('muestra los tipos de orientación seleccionados', () => {
    useMentorProfileMock.mockReturnValue({
      data: MENTOR_PROFILE_FIXTURE,
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    });

    render(<MentorProfilePreview {...defaultProps} />);

    expect(
      screen.getByRole('heading', { name: 'Tipos de orientación' }),
    ).toBeVisible();

    for (const orientation of defaultProps.orientationTypes) {
      expect(screen.getByText(orientation.name)).toBeVisible();
    }
  });

  it('presenta una sola opción inferior para volver a editar', () => {
    useMentorProfileMock.mockReturnValue({
      data: MENTOR_PROFILE_FIXTURE,
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    });

    render(<MentorProfilePreview {...defaultProps} />);

    expect(
      screen.getAllByRole('button', { name: 'Volver a editar' }),
    ).toHaveLength(1);
  });

  it('permite regresar al formulario desde el botón inferior', async () => {
    const user = userEvent.setup();

    useMentorProfileMock.mockReturnValue({
      data: MENTOR_PROFILE_FIXTURE,
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    });

    render(<MentorProfilePreview {...defaultProps} />);

    await user.click(
      screen.getByRole('button', { name: 'Volver a editar' }),
    );

    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('permite personalizar el texto del botón de retorno', () => {
    useMentorProfileMock.mockReturnValue({
      data: MENTOR_PROFILE_FIXTURE,
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    });

    render(
      <MentorProfilePreview
        {...defaultProps}
        backLabel="Volver"
      />,
    );

    expect(
      screen.getByRole('button', { name: 'Volver' }),
    ).toBeVisible();

    expect(
      screen.queryByRole('button', { name: 'Volver a editar' }),
    ).not.toBeInTheDocument();
  });

  it('no muestra controles para guardar cambios ni editar el perfil', () => {
    useMentorProfileMock.mockReturnValue({
      data: MENTOR_PROFILE_FIXTURE,
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    });

    render(<MentorProfilePreview {...defaultProps} />);

    expect(
      screen.queryByRole('button', { name: /guardar cambios/i }),
    ).not.toBeInTheDocument();

    expect(
      screen.queryByRole('button', { name: /editar perfil/i }),
    ).not.toBeInTheDocument();
  });

  it('muestra el indicador de carga', () => {
    useMentorProfileMock.mockReturnValue({
      data: undefined,
      isPending: true,
      isError: false,
      refetch: vi.fn(),
    });

    render(<MentorProfilePreview {...defaultProps} />);

    expect(
      screen.getByText('Cargando vista previa del perfil...'),
    ).toBeVisible();
  });

  it('muestra un mensaje cuando falla la carga del perfil', () => {
    useMentorProfileMock.mockReturnValue({
      data: undefined,
      isPending: false,
      isError: true,
      refetch: vi.fn(),
    });

    render(<MentorProfilePreview {...defaultProps} />);

    expect(
      screen.getByText(
        'No se pudo cargar la información del perfil del mentor.',
      ),
    ).toBeVisible();

    expect(
      screen.getByRole('button', { name: 'Volver a editar' }),
    ).toBeVisible();
  });

  it('permite reintentar la carga del perfil', async () => {
    const user = userEvent.setup();
    const refetch = vi.fn();

    useMentorProfileMock.mockReturnValue({
      data: undefined,
      isPending: false,
      isError: true,
      refetch,
    });

    render(<MentorProfilePreview {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: 'Reintentar' }));

    expect(refetch).toHaveBeenCalledTimes(1);
  });
});
