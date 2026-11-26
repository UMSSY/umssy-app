import { act, renderHook, waitFor } from '@testing-library/react';
import type { FormEvent } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { companyAccessRequestService } from '../services/company-access-request.service';
import type {
  CompanyActivationStatusResult,
  CompanyOfficialData,
} from '../types/company-access-request.types';
import { useCompanyAccountActivation } from './use-company-account-activation';

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

const service = vi.mocked(companyAccessRequestService);

const OFFICIAL_DATA: CompanyOfficialData = {
  requestCode: 'EMP-2026-0001',
  companyName: 'TecnoAndes S.R.L.',
  city: 'Cochabamba',
  sector: 'Software',
  email: 'rrhh@tecnoandes.bo',
  phone: '71234567',
  websiteUrl: 'https://tecnoandes.bo',
  description: 'Desarrollo de software a medida',
  username: 'tecnoandes',
};

const submitEvent = { preventDefault: vi.fn() } as unknown as FormEvent;
const VALID_PARAMS = 'email=RRHH@TecnoAndes.bo&otp=123456&code=emp-2026-0001';

function status(result: CompanyActivationStatusResult) {
  return { ok: true as const, data: result };
}

function failure(message: string) {
  return { ok: false as const, status: 500, fieldErrors: {}, message };
}

async function renderActivation(query = VALID_PARAMS) {
  mockSearchParams = new URLSearchParams(query);
  const hook = renderHook(() => useCompanyAccountActivation());
  await waitFor(() => expect(hook.result.current.loading).toBe(false));
  return hook;
}

async function renderReady() {
  service.getActivationStatus.mockResolvedValue(status({ state: 'READY', data: OFFICIAL_DATA }));
  return renderActivation();
}

function typePasswords(
  result: { current: ReturnType<typeof useCompanyAccountActivation> },
  password: string,
  confirmation = password,
) {
  act(() => result.current.setPassword(password));
  act(() => result.current.setConfirmPassword(confirmation));
}

describe('useCompanyAccountActivation', () => {
  beforeEach(() => {
    mockSearchParams = new URLSearchParams();
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  describe('estado inicial de la solicitud', () => {
    it('marca el acceso como inválido cuando falta el correo en el enlace', async () => {
      const { result } = await renderActivation('');

      expect(service.getActivationStatus).not.toHaveBeenCalled();
      expect(result.current.state).toBe('INVALID');
      expect(result.current.serverMessage).toBe(
        'Debe acceder a este apartado mediante el enlace oficial enviado a su correo electrónico.',
      );
    });

    it('consulta el estado con el correo en minúsculas, el código en mayúsculas y el otp', async () => {
      service.getActivationStatus.mockResolvedValue(status({ state: 'READY', data: OFFICIAL_DATA }));

      const { result } = await renderActivation();

      expect(service.getActivationStatus).toHaveBeenCalledWith({
        email: 'rrhh@tecnoandes.bo',
        code: 'EMP-2026-0001',
        otp: '123456',
      });
      expect(result.current.trackingCode).toBe('EMP-2026-0001');
    });

    it('acepta el parámetro token como otp y omite el código vacío', async () => {
      service.getActivationStatus.mockResolvedValue(status({ state: 'REQUIRES_CODE' }));

      await renderActivation('email=rrhh@tecnoandes.bo&token=999000');

      expect(service.getActivationStatus).toHaveBeenCalledWith({
        email: 'rrhh@tecnoandes.bo',
        code: undefined,
        otp: '999000',
      });
    });

    it('muestra los datos oficiales cuando el estado es READY', async () => {
      const { result } = await renderReady();

      expect(result.current.state).toBe('READY');
      expect(result.current.officialData).toEqual(OFFICIAL_DATA);
      expect(result.current.canFinalize).toBe(false);
    });

    it('marca la solicitud como inválida con el mensaje del servidor cuando la consulta falla', async () => {
      service.getActivationStatus.mockResolvedValue(failure('Servicio no disponible'));

      const { result } = await renderActivation();

      expect(result.current.state).toBe('INVALID');
      expect(result.current.serverMessage).toBe('Servicio no disponible');
    });

    it('usa un mensaje genérico si la consulta falla sin mensaje', async () => {
      service.getActivationStatus.mockResolvedValue(failure(''));

      const { result } = await renderActivation();

      expect(result.current.serverMessage).toBe('No se pudo verificar el estado de la solicitud.');
    });

    it('informa que la cuenta ya fue activada', async () => {
      service.getActivationStatus.mockResolvedValue(status({ state: 'ALREADY_ACTIVATED' }));

      const { result } = await renderActivation();

      expect(result.current.state).toBe('ALREADY_ACTIVATED');
      expect(result.current.serverMessage).toBe('Esta cuenta institucional ya ha sido activada.');
    });

    it('informa que el código expiró y respeta el mensaje del servidor', async () => {
      service.getActivationStatus.mockResolvedValue(status({ state: 'EXPIRED' }));
      const withDefault = await renderActivation();
      expect(withDefault.result.current.state).toBe('EXPIRED');
      expect(withDefault.result.current.serverMessage).toBe(
        'El enlace o código de activación ha expirado (plazo de 24 horas vencido).',
      );

      service.getActivationStatus.mockResolvedValue(status({ state: 'EXPIRED', message: 'Venció ayer' }));
      const withMessage = await renderActivation();
      expect(withMessage.result.current.serverMessage).toBe('Venció ayer');
    });

    it.each(['REQUIRES_CODE', 'INVALID_CODE'] as const)(
      'pide el código de seguimiento cuando el estado es %s',
      async (state) => {
        service.getActivationStatus.mockResolvedValue(status({ state, message: 'Ingrese el código' }));

        const { result } = await renderActivation();

        expect(result.current.state).toBe('REQUIRES_CODE');
        expect(result.current.serverMessage).toBe('Ingrese el código');
      },
    );

    it('deja el mensaje vacío si el servidor no explica por qué pide el código', async () => {
      service.getActivationStatus.mockResolvedValue(status({ state: 'REQUIRES_CODE' }));

      const { result } = await renderActivation();

      expect(result.current.serverMessage).toBe('');
    });

    it.each(['NOT_FOUND', 'INVALID', 'REJECTED', 'OBSERVED', 'PENDING'] as const)(
      'conserva el estado %s con el mensaje del servidor',
      async (state) => {
        service.getActivationStatus.mockResolvedValue(status({ state, message: `Mensaje ${state}` }));

        const { result } = await renderActivation();

        expect(result.current.state).toBe(state);
        expect(result.current.serverMessage).toBe(`Mensaje ${state}`);
        expect(result.current.officialData).toBeNull();
      },
    );

    it('usa el mensaje genérico cuando el estado no es apto y el servidor no envía mensaje', async () => {
      service.getActivationStatus.mockResolvedValue(status({ state: 'PENDING' }));

      const { result } = await renderActivation();

      expect(result.current.serverMessage).toBe(
        'La solicitud no se encuentra en estado apto para activación.',
      );
    });

    it('no muestra datos si el estado es READY pero el servidor no los envía', async () => {
      service.getActivationStatus.mockResolvedValue(status({ state: 'READY' }));

      const { result } = await renderActivation();

      expect(result.current.officialData).toBeNull();
      expect(result.current.canFinalize).toBe(false);
    });
  });

  describe('verificación del código de seguimiento', () => {
    async function renderRequiringCode() {
      service.getActivationStatus.mockResolvedValue(status({ state: 'REQUIRES_CODE' }));
      return renderActivation('email=rrhh@tecnoandes.bo&otp=123456');
    }

    it('pide el código cuando se envía vacío', async () => {
      const { result } = await renderRequiringCode();
      service.getActivationStatus.mockClear();

      act(() => result.current.handleVerifyCode(submitEvent));

      expect(submitEvent.preventDefault).toHaveBeenCalled();
      expect(result.current.codeError).toBe('Ingrese el código de seguimiento de su solicitud.');
      expect(service.getActivationStatus).not.toHaveBeenCalled();
    });

    it('muestra los datos oficiales cuando el código es correcto', async () => {
      const { result } = await renderRequiringCode();
      act(() => result.current.setTrackingCode(' emp-2026-0001 '));
      service.getActivationStatus.mockResolvedValue(status({ state: 'READY', data: OFFICIAL_DATA }));

      act(() => result.current.handleVerifyCode(submitEvent));

      await waitFor(() => expect(result.current.state).toBe('READY'));
      expect(service.getActivationStatus).toHaveBeenLastCalledWith({
        email: 'rrhh@tecnoandes.bo',
        code: 'EMP-2026-0001',
        otp: '123456',
      });
      expect(result.current.officialData).toEqual(OFFICIAL_DATA);
      expect(result.current.codeError).toBeNull();
    });

    it('muestra el error de código incorrecto con el mensaje del servidor o el genérico', async () => {
      const { result } = await renderRequiringCode();
      act(() => result.current.setTrackingCode('EMP-0000'));
      service.getActivationStatus.mockResolvedValue(status({ state: 'INVALID_CODE', message: 'No coincide' }));

      act(() => result.current.handleVerifyCode(submitEvent));
      await waitFor(() => expect(result.current.codeError).toBe('No coincide'));

      service.getActivationStatus.mockResolvedValue(status({ state: 'INVALID_CODE' }));
      act(() => result.current.handleVerifyCode(submitEvent));
      await waitFor(() =>
        expect(result.current.codeError).toBe(
          'El código de seguimiento no coincide con la solicitud registrada.',
        ),
      );
      expect(result.current.state).toBe('REQUIRES_CODE');
    });

    it('muestra el error del servicio cuando la verificación falla', async () => {
      const { result } = await renderRequiringCode();
      act(() => result.current.setTrackingCode('EMP-2026-0001'));
      service.getActivationStatus.mockResolvedValue(failure('Sin conexión'));

      act(() => result.current.handleVerifyCode(submitEvent));
      await waitFor(() => expect(result.current.codeError).toBe('Sin conexión'));

      service.getActivationStatus.mockResolvedValue(failure(''));
      act(() => result.current.handleVerifyCode(submitEvent));
      await waitFor(() =>
        expect(result.current.codeError).toBe('Error al verificar el código de seguimiento.'),
      );
    });

    it('pasa al estado de cuenta ya activada o de código expirado', async () => {
      const { result } = await renderRequiringCode();
      act(() => result.current.setTrackingCode('EMP-2026-0001'));

      service.getActivationStatus.mockResolvedValue(status({ state: 'ALREADY_ACTIVATED' }));
      act(() => result.current.handleVerifyCode(submitEvent));
      await waitFor(() => expect(result.current.state).toBe('ALREADY_ACTIVATED'));

      service.getActivationStatus.mockResolvedValue(status({ state: 'EXPIRED' }));
      act(() => result.current.handleVerifyCode(submitEvent));
      await waitFor(() => expect(result.current.state).toBe('EXPIRED'));
    });

    it('muestra un error cuando el estado devuelto no permite validar el código', async () => {
      const { result } = await renderRequiringCode();
      act(() => result.current.setTrackingCode('EMP-2026-0001'));
      service.getActivationStatus.mockResolvedValue(status({ state: 'PENDING' }));

      act(() => result.current.handleVerifyCode(submitEvent));
      await waitFor(() => expect(result.current.codeError).toBe('No se pudo validar el código.'));

      service.getActivationStatus.mockResolvedValue(status({ state: 'REJECTED', message: 'Fue rechazada' }));
      act(() => result.current.handleVerifyCode(submitEvent));
      await waitFor(() => expect(result.current.codeError).toBe('Fue rechazada'));
    });
  });

  describe('reporte de inconsistencia', () => {
    it('exige una observación de al menos 5 caracteres', async () => {
      const { result } = await renderReady();
      act(() => result.current.setReportObservation('  ab '));

      await act(() => result.current.handleSendReport());

      expect(service.reportInconsistency).not.toHaveBeenCalled();
      expect(result.current.reportStatus).toBe('error');
      expect(result.current.reportMessage).toBe(
        'Por favor describa la observación con al menos 5 caracteres.',
      );
    });

    it('registra el reporte, muestra la confirmación y cierra el diálogo a los 2 s', async () => {
      service.reportInconsistency.mockResolvedValue({ ok: true, data: { ok: true } } as never);
      const { result } = await renderReady();
      act(() => result.current.setIsReportOpen(true));
      act(() => result.current.setReportObservation('  La razón social está mal escrita  '));
      vi.useFakeTimers();

      await act(() => result.current.handleSendReport());

      expect(service.reportInconsistency).toHaveBeenCalledWith({
        requestCode: 'EMP-2026-0001',
        email: 'rrhh@tecnoandes.bo',
        observation: 'La razón social está mal escrita',
      });
      expect(result.current.reportStatus).toBe('success');
      expect(result.current.reportMessage).toBe(
        'Su observación fue registrada formalmente para revisión administrativa.',
      );

      act(() => {
        vi.advanceTimersByTime(2000);
      });
      expect(result.current.isReportOpen).toBe(false);
      expect(result.current.reportObservation).toBe('');
      expect(result.current.reportStatus).toBe('idle');
    });

    it('usa el código de seguimiento escrito cuando aún no hay datos oficiales', async () => {
      service.reportInconsistency.mockResolvedValue({ ok: true, data: { ok: true } } as never);
      service.getActivationStatus.mockResolvedValue(status({ state: 'REQUIRES_CODE' }));
      const { result } = await renderActivation('email=rrhh@tecnoandes.bo&code=emp-9');
      act(() => result.current.setReportObservation('Mi dato es incorrecto'));

      await act(() => result.current.handleSendReport());

      expect(service.reportInconsistency).toHaveBeenCalledWith(
        expect.objectContaining({ requestCode: 'EMP-9' }),
      );
    });

    it('muestra el error del servidor o el genérico si el reporte falla', async () => {
      const { result } = await renderReady();
      act(() => result.current.setReportObservation('Observación válida'));

      service.reportInconsistency.mockResolvedValue(failure('Reporte duplicado'));
      await act(() => result.current.handleSendReport());
      expect(result.current.reportStatus).toBe('error');
      expect(result.current.reportMessage).toBe('Reporte duplicado');

      service.reportInconsistency.mockResolvedValue(failure(''));
      await act(() => result.current.handleSendReport());
      expect(result.current.reportMessage).toBe('No se pudo registrar el reporte de inconsistencia.');
    });
  });

  describe('contraseña y activación', () => {
    it('evalúa los requisitos de la contraseña y la confirmación', async () => {
      const { result } = await renderReady();

      typePasswords(result, 'abcdefgh', 'otra');
      expect(result.current.hasMinLength).toBe(true);
      expect(result.current.hasUppercase).toBe(false);
      expect(result.current.hasNumber).toBe(false);
      expect(result.current.passwordsMatch).toBe(false);
      expect(result.current.canFinalize).toBe(false);

      typePasswords(result, 'Abcdefg1');
      expect(result.current.hasUppercase).toBe(true);
      expect(result.current.hasNumber).toBe(true);
      expect(result.current.passwordsMatch).toBe(true);
      expect(result.current.canFinalize).toBe(true);
    });

    it('no permite finalizar sin confirmación o con una contraseña corta', async () => {
      const { result } = await renderReady();

      typePasswords(result, 'Ab1', 'Ab1');
      expect(result.current.hasMinLength).toBe(false);
      expect(result.current.canFinalize).toBe(false);

      typePasswords(result, 'Abcdefg1', '');
      expect(result.current.passwordsMatch).toBe(false);
      expect(result.current.canFinalize).toBe(false);
    });

    it('alterna la visibilidad de la contraseña y de su confirmación', async () => {
      const { result } = await renderReady();

      act(() => result.current.setShowPassword(true));
      act(() => result.current.setShowConfirmPassword(true));

      expect(result.current.showPassword).toBe(true);
      expect(result.current.showConfirmPassword).toBe(true);
    });

    it('no activa la cuenta si todavía no se puede finalizar', async () => {
      const { result } = await renderReady();
      typePasswords(result, 'corta');

      await act(() => result.current.handleConfirmActivation());

      expect(service.activateAccount).not.toHaveBeenCalled();
    });

    it('no activa la cuenta si no hay datos oficiales', async () => {
      service.getActivationStatus.mockResolvedValue(status({ state: 'REQUIRES_CODE' }));
      const { result } = await renderActivation('email=rrhh@tecnoandes.bo');
      typePasswords(result, 'Abcdefg1');

      await act(() => result.current.handleConfirmActivation());

      expect(service.activateAccount).not.toHaveBeenCalled();
    });

    it('activa la cuenta con el código y la contraseña y pasa al estado de éxito', async () => {
      service.activateAccount.mockResolvedValue({ ok: true, data: { ok: true } } as never);
      const { result } = await renderReady();
      typePasswords(result, 'Abcdefg1');
      act(() => result.current.setIsConfirmModalOpen(true));

      await act(() => result.current.handleConfirmActivation());

      expect(service.activateAccount).toHaveBeenCalledWith({
        requestCode: 'EMP-2026-0001',
        email: 'rrhh@tecnoandes.bo',
        code: '123456',
        password: 'Abcdefg1',
      });
      expect(result.current.state).toBe('SUCCESS');
      expect(result.current.isConfirmModalOpen).toBe(false);
      expect(result.current.activationError).toBeNull();
    });

    it('muestra el error del backend y permite reintentar cuando la activación falla', async () => {
      service.activateAccount.mockResolvedValue(failure('El código ya fue utilizado'));
      const { result } = await renderReady();
      typePasswords(result, 'Abcdefg1');
      act(() => result.current.setIsConfirmModalOpen(true));

      await act(() => result.current.handleConfirmActivation());

      expect(result.current.state).toBe('READY');
      expect(result.current.activationError).toBe('El código ya fue utilizado');
      expect(result.current.isActivating).toBe(false);
      expect(result.current.isConfirmModalOpen).toBe(true);
      expect(result.current.canFinalize).toBe(true);
    });

    it('usa un mensaje genérico si el backend no explica el error de activación', async () => {
      service.activateAccount.mockResolvedValue(failure(''));
      const { result } = await renderReady();
      typePasswords(result, 'Abcdefg1');

      await act(() => result.current.handleConfirmActivation());

      expect(result.current.activationError).toBe(
        'No se pudo completar la activación. Verifique que el código no haya expirado.',
      );
    });
  });

  it('lleva al inicio de sesión desde cualquier estado', async () => {
    const { result } = await renderReady();

    act(() => result.current.goToLogin());

    expect(mockPush).toHaveBeenCalledWith('/login');
  });
});
