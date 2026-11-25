import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { companyAccessRequestService } from '../services/company-access-request.service';
import { CompanyAccountActivationView } from './company-account-activation-view';

const mockPush = vi.fn();
let mockSearchParams = new URLSearchParams();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => mockSearchParams,
}));

vi.mock('../services/company-access-request.service', () => ({
  companyAccessRequestService: {
    getActivationStatus: vi.fn(),
    reportInconsistency: vi.fn(),
    activateAccount: vi.fn(),
  },
}));

describe('CompanyAccountActivationView', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    mockSearchParams = new URLSearchParams();
  });

  it('muestra acceso no disponible cuando falta email en la URL', async () => {
    const { container } = render(<CompanyAccountActivationView />);

    expect(container.firstChild).toHaveClass('min-h-dvh');
    expect(
      await screen.findByRole('heading', { name: /Acceso no disponible/i }),
    ).toBeInTheDocument();
  });

  it('muestra formulario de contraseña cuando el estado es READY', async () => {
    mockSearchParams = new URLSearchParams('email=hr@tecno.bo&code=EMP-2026-0001&otp=123456');
    vi.mocked(companyAccessRequestService.getActivationStatus).mockResolvedValue({
      ok: true,
      data: {
        state: 'READY',
        data: {
          requestCode: 'EMP-2026-0001',
          companyName: 'TecnoAndes S.R.L.',
          city: 'Cochabamba',
          sector: 'Software',
          email: 'hr@tecno.bo',
          phone: '71234567',
          websiteUrl: 'https://tecno.bo',
          description: 'Empresa de software',
          username: 'hr.tecno',
        },
      },
    });

    render(<CompanyAccountActivationView />);

    expect(
      await screen.findByRole('heading', { name: /Activación de Cuenta Institucional/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Nueva contraseña institucional/i)).toBeInTheDocument();
  });
});
