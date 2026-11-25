import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AccessRequestProvider } from '../../contexts/access-request-context';
import { companyAccessRequestService } from '../../services/company-access-request.service';
import { CompanyAccessRequestFlow } from './company-access-request-flow';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('../../services/company-access-request.service', () => ({
  companyAccessRequestService: {
    getCities: vi.fn(),
    createDraft: vi.fn(),
    uploadLogo: vi.fn(),
    uploadDocument: vi.fn(),
    submit: vi.fn(),
  },
}));

describe('CompanyAccessRequestFlow', () => {
  beforeEach(() => {
    vi.mocked(companyAccessRequestService.getCities).mockResolvedValue({
      ok: true,
      data: [{ id: 'city-1', name: 'Cochabamba' }],
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renderiza el paso 1 con min-h-dvh y carga ciudades', async () => {
    const { container } = render(
      <AccessRequestProvider>
        <CompanyAccessRequestFlow onSwitchToGraduate={vi.fn()} />
      </AccessRequestProvider>,
    );

    expect(container.firstChild).toHaveClass('min-h-dvh');
    expect(
      screen.getByRole('heading', { name: /Registra tu empresa/i }),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(companyAccessRequestService.getCities).toHaveBeenCalledTimes(1);
    });
  });

  it('muestra diálogo de conflicto cuando createDraft devuelve 409', async () => {
    vi.mocked(companyAccessRequestService.createDraft).mockResolvedValue({
      ok: false,
      status: 409,
      fieldErrors: {},
      code: 'COMPANY_REGISTRATION_CONFLICT',
      conflictField: 'email',
      message: 'El correo ya está registrado',
    });

    const user = userEvent.setup();
    render(
      <AccessRequestProvider>
        <CompanyAccessRequestFlow onSwitchToGraduate={vi.fn()} />
      </AccessRequestProvider>,
    );

    await user.type(screen.getByLabelText(/Nombre de la empresa/i), 'TecnoAndes');
    await user.type(screen.getByLabelText(/Rubro o sector/i), 'Software');
    await user.type(screen.getByLabelText(/Descripción de la empresa/i), 'Empresa de software.');
    await user.type(screen.getByLabelText(/Correo institucional/i), 'hr@tecno.bo');
    await user.type(screen.getByLabelText(/Teléfono \/ Celular/i), '71234567');
    await user.type(screen.getByLabelText(/Usuario reclutador/i), 'hr.tecno');

    await user.click(screen.getByRole('button', { name: /Continuar al siguiente paso/i }));

    expect(
      await screen.findByText(/Registro no disponible: Información ya existente/i),
    ).toBeInTheDocument();
  });
});
