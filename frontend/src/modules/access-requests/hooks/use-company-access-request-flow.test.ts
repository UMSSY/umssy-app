import { act, renderHook, waitFor } from '@testing-library/react';
import type { ChangeEvent, DragEvent, FormEvent } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { companyAccessRequestService } from '../services/company-access-request.service';
import { useCompanyAccessRequestFlow } from './use-company-access-request-flow';

vi.mock('../services/company-access-request.service', () => ({
  companyAccessRequestService: {
    getCities: vi.fn(),
    createDraft: vi.fn(),
    uploadLogo: vi.fn(),
    uploadDocument: vi.fn(),
    submit: vi.fn(),
  },
}));

const service = vi.mocked(companyAccessRequestService);

function failure(
  status: number,
  message: string,
  extra: { code?: string; conflictField?: 'email' | 'companyName' | 'activeRequest' } = {},
) {
  return { ok: false as const, status, fieldErrors: {}, message, ...extra };
}

const MB = 1024 * 1024;
const submitEvent = { preventDefault: vi.fn() } as unknown as FormEvent;

function fileOf(type: string, size = 1024, name = 'archivo') {
  const file = new File(['x'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
}

function changeEvent(file: File) {
  return { target: { files: [file] } } as unknown as ChangeEvent<HTMLInputElement>;
}

function dropEvent(file: File | null) {
  return {
    preventDefault: vi.fn(),
    dataTransfer: { files: file ? [file] : [] },
  } as unknown as DragEvent<HTMLDivElement>;
}

async function renderFlow() {
  const hook = renderHook(() => useCompanyAccessRequestFlow());
  await waitFor(() => expect(hook.result.current.cities.length).toBeGreaterThan(0));
  return hook;
}

function fillForm(result: { current: ReturnType<typeof useCompanyAccessRequestFlow> }) {
  act(() => {
    result.current.setForm({
      ...result.current.form,
      companyName: 'TecnoAndes',
      sector: 'Software',
      description: 'Desarrollo de software a medida',
      email: 'rrhh@tecnoandes.bo',
      phone: '71234567',
      websiteUrl: '  https://tecnoandes.bo  ',
      username: 'tecnoandes',
    });
  });
}

describe('useCompanyAccessRequestFlow', () => {
  let revokeObjectURL: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    service.getCities.mockResolvedValue({
      ok: true,
      data: [
        { id: 'city-1', name: 'Cochabamba' },
        { id: 'city-2', name: 'La Paz' },
      ],
    });
    revokeObjectURL = vi.fn();
    vi.stubGlobal('URL', Object.assign(URL, {
      createObjectURL: vi.fn(() => 'blob:vista-previa'),
      revokeObjectURL,
    }));
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  describe('ciudades', () => {
    it('carga las ciudades y selecciona la primera por defecto', async () => {
      const { result } = await renderFlow();

      expect(service.getCities).toHaveBeenCalledTimes(1);
      expect(result.current.cities.map((city) => city.name)).toEqual(['Cochabamba', 'La Paz']);
      expect(result.current.form.cityId).toBe('city-1');
      expect(result.current.step).toBe(1);
    });

    it('no pisa la ciudad ya elegida cuando llegan las ciudades', async () => {
      const { result } = await renderFlow();

      act(() => result.current.setForm({ ...result.current.form, cityId: 'city-2' }));

      expect(result.current.form.cityId).toBe('city-2');
    });

    it('conserva el formulario vacío si el servicio no devuelve ciudades', async () => {
      service.getCities.mockResolvedValue(failure(500, 'Error'));
      const { result } = renderHook(() => useCompanyAccessRequestFlow());

      await waitFor(() => expect(service.getCities).toHaveBeenCalled());

      expect(result.current.cities).toEqual([]);
      expect(result.current.form.cityId).toBe('');
    });

    it('deja la ciudad vacía si la lista llega vacía', async () => {
      service.getCities.mockResolvedValue({ ok: true, data: [] });
      const { result } = renderHook(() => useCompanyAccessRequestFlow());

      await waitFor(() => expect(service.getCities).toHaveBeenCalled());

      expect(result.current.cities).toEqual([]);
      expect(result.current.form.cityId).toBe('');
    });
  });

  describe('logo', () => {
    it('rechaza un formato no permitido y limpia el campo de archivo', async () => {
      const { result } = await renderFlow();
      result.current.logoInputRef.current = { value: 'logo.gif' } as HTMLInputElement;

      act(() => result.current.handleLogoChange(changeEvent(fileOf('image/gif'))));

      expect(result.current.error).toBe(
        'Formato no válido para el logo. Solo se permiten imágenes PNG, JPG o WEBP.',
      );
      expect(result.current.logoFile).toBeNull();
      expect(result.current.logoPreview).toBeNull();
      expect(result.current.logoInputRef.current?.value).toBe('');
    });

    it('rechaza un logo de más de 2 MB y limpia el campo de archivo', async () => {
      const { result } = await renderFlow();
      result.current.logoInputRef.current = { value: 'logo.png' } as HTMLInputElement;

      act(() => result.current.handleLogoChange(changeEvent(fileOf('image/png', 2 * MB + 1))));

      expect(result.current.error).toBe('El logo no debe superar los 2 MB.');
      expect(result.current.logoFile).toBeNull();
      expect(result.current.logoInputRef.current?.value).toBe('');
    });

    it('acepta un logo de exactamente 2 MB', async () => {
      const { result } = await renderFlow();

      act(() => result.current.handleLogoChange(changeEvent(fileOf('image/jpeg', 2 * MB))));

      expect(result.current.error).toBeNull();
      expect(result.current.logoFile).not.toBeNull();
    });

    it('rechaza sin fallar si no hay referencia al campo de archivo', async () => {
      const { result } = await renderFlow();

      act(() => result.current.handleLogoChange(changeEvent(fileOf('application/pdf'))));

      expect(result.current.error).toContain('Formato no válido para el logo');
    });

    it('acepta un PNG válido, genera la vista previa y mide sus dimensiones', async () => {
      class FakeImage {
        naturalWidth = 320;
        naturalHeight = 160;
        onload: (() => void) | null = null;
        set src(_value: string) {
          queueMicrotask(() => this.onload?.());
        }
      }
      vi.stubGlobal('Image', FakeImage);
      const { result } = await renderFlow();
      const logo = fileOf('image/png', 500 * 1024, 'logo.png');

      act(() => result.current.handleLogoChange(changeEvent(logo)));

      expect(result.current.error).toBeNull();
      expect(result.current.logoFile).toBe(logo);
      expect(result.current.logoPreview).toBe('blob:vista-previa');
      await waitFor(() => expect(result.current.logoDimensions).toEqual({ width: 320, height: 160 }));
    });

    it('ignora el evento si no se seleccionó ningún archivo', async () => {
      const { result } = await renderFlow();

      act(() =>
        result.current.handleLogoChange({ target: { files: [] } } as unknown as ChangeEvent<HTMLInputElement>),
      );

      expect(result.current.logoFile).toBeNull();
      expect(result.current.error).toBeNull();
    });

    it('acepta un logo arrastrado y suelto', async () => {
      const { result } = await renderFlow();
      const event = dropEvent(fileOf('image/jpeg'));
      act(() => result.current.setIsLogoDragging(true));

      act(() => result.current.handleLogoDrop(event));

      expect(event.preventDefault).toHaveBeenCalled();
      expect(result.current.isLogoDragging).toBe(false);
      expect(result.current.logoFile).not.toBeNull();
    });

    it('no hace nada si se suelta algo que no es un archivo', async () => {
      const { result } = await renderFlow();

      act(() => result.current.handleLogoDrop(dropEvent(null)));

      expect(result.current.logoFile).toBeNull();
    });

    it('retira el logo, libera la vista previa y cierra el modal', async () => {
      const { result } = await renderFlow();
      result.current.logoInputRef.current = { value: 'logo.png' } as HTMLInputElement;
      act(() => result.current.handleLogoChange(changeEvent(fileOf('image/png'))));
      act(() => result.current.setIsLogoModalOpen(true));

      act(() => result.current.handleRemoveLogo());

      expect(result.current.logoFile).toBeNull();
      expect(result.current.logoPreview).toBeNull();
      expect(result.current.logoDimensions).toBeNull();
      expect(result.current.isLogoModalOpen).toBe(false);
      expect(result.current.logoInputRef.current?.value).toBe('');
      expect(revokeObjectURL).toHaveBeenCalledWith('blob:vista-previa');
    });

    it('libera la vista previa anterior al reemplazar el logo', async () => {
      const { result } = await renderFlow();
      act(() => result.current.handleLogoChange(changeEvent(fileOf('image/png'))));

      act(() => result.current.handleLogoChange(changeEvent(fileOf('image/jpeg'))));

      expect(revokeObjectURL).toHaveBeenCalledWith('blob:vista-previa');
    });

    it('cierra el modal del logo con la tecla Escape', async () => {
      const { result } = await renderFlow();
      act(() => result.current.setIsLogoModalOpen(true));

      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
      });
      expect(result.current.isLogoModalOpen).toBe(true);

      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      });
      expect(result.current.isLogoModalOpen).toBe(false);
    });
  });

  describe('carta de solicitud', () => {
    it('rechaza un formato no permitido', async () => {
      const { result } = await renderFlow();

      act(() => result.current.handleDocumentSelected(fileOf('application/msword', 1024, 'carta.doc')));

      expect(result.current.documentError).toBe(
        'Formato no permitido. Solo se aceptan archivos JPG, PNG o PDF.',
      );
      expect(result.current.documentFile).toBeNull();
    });

    it('rechaza un archivo de más de 10 MB', async () => {
      const { result } = await renderFlow();

      act(() => result.current.handleDocumentSelected(fileOf('application/pdf', 10 * MB + 1)));

      expect(result.current.documentError).toBe('El archivo supera el máximo de 10 MB.');
      expect(result.current.documentFile).toBeNull();
    });

    it('acepta una carta PDF válida y limpia los errores anteriores', async () => {
      const { result } = await renderFlow();
      act(() => result.current.handleDocumentSelected(fileOf('image/gif')));
      const carta = fileOf('application/pdf', 10 * MB, 'carta.pdf');

      act(() => result.current.handleDocumentSelected(carta));

      expect(result.current.documentError).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.documentFile).toBe(carta);
      expect(result.current.documentPreviewUrl).toBe('blob:vista-previa');
    });

    it('libera la vista previa anterior al reemplazar la carta y al retirarla', async () => {
      const { result } = await renderFlow();
      act(() => result.current.handleDocumentSelected(fileOf('image/png')));

      act(() => result.current.handleDocumentSelected(fileOf('image/jpeg')));
      expect(revokeObjectURL).toHaveBeenCalledWith('blob:vista-previa');
      revokeObjectURL.mockClear();

      act(() => result.current.handleRemoveDocument());

      expect(revokeObjectURL).toHaveBeenCalledWith('blob:vista-previa');
      expect(result.current.documentFile).toBeNull();
      expect(result.current.documentPreviewUrl).toBeNull();
      expect(result.current.documentError).toBeNull();
    });
  });

  describe('paso 1: crear el borrador', () => {
    it('crea el borrador con el sitio web recortado y pasa al paso 2 sin logo', async () => {
      service.createDraft.mockResolvedValue({ ok: true, data: { id: 'draft-1' } });
      const { result } = await renderFlow();
      fillForm(result);

      await act(() => result.current.handleStep1Submit(submitEvent));

      expect(submitEvent.preventDefault).toHaveBeenCalled();
      expect(service.createDraft).toHaveBeenCalledWith(
        expect.objectContaining({ companyName: 'TecnoAndes', cityId: 'city-1', websiteUrl: 'https://tecnoandes.bo' }),
      );
      expect(service.uploadLogo).not.toHaveBeenCalled();
      expect(result.current.step).toBe(2);
      expect(result.current.submitting).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('tolera un sitio web ausente al crear el borrador', async () => {
      service.createDraft.mockResolvedValue({ ok: true, data: { id: 'draft-1' } });
      const { result } = await renderFlow();
      act(() => result.current.setForm({ ...result.current.form, websiteUrl: undefined }));

      await act(() => result.current.handleStep1Submit(submitEvent));

      expect(service.createDraft).toHaveBeenCalledWith(expect.objectContaining({ websiteUrl: '' }));
      expect(result.current.step).toBe(2);
    });

    it('sube el logo del borrador antes de avanzar', async () => {
      service.createDraft.mockResolvedValue({ ok: true, data: { id: 'draft-1' } });
      service.uploadLogo.mockResolvedValue({ ok: true, data: { id: 'draft-1', logoFileId: 'logo-1' } });
      const { result } = await renderFlow();
      const logo = fileOf('image/png');
      act(() => result.current.handleLogoChange(changeEvent(logo)));

      await act(() => result.current.handleStep1Submit(submitEvent));

      expect(service.uploadLogo).toHaveBeenCalledWith('draft-1', logo);
      expect(result.current.step).toBe(2);
    });

    it('muestra el modal de conflicto por correo y no avanza al recibir un 409', async () => {
      service.createDraft.mockResolvedValue(
        failure(409, 'El correo ya pertenece a una cuenta.', {
          code: 'COMPANY_REGISTRATION_CONFLICT',
          conflictField: 'email',
        }),
      );
      const { result } = await renderFlow();

      await act(() => result.current.handleStep1Submit(submitEvent));

      expect(result.current.step).toBe(1);
      expect(result.current.submitting).toBe(false);
      expect(result.current.error).toBe('El correo ya pertenece a una cuenta.');
      expect(result.current.errorModal).toMatchObject({
        open: true,
        category: 'conflict',
        title: 'Registro no disponible: Información ya existente',
        field: 'email',
      });
      expect(result.current.errorModal.recommendation).toContain('correo electrónico único');
    });

    it.each([
      ['companyName', 'ya se encuentra registrada'],
      ['activeRequest', 'solicitud en proceso de evaluación'],
    ] as const)('usa la recomendación del conflicto %s', async (conflictField, expected) => {
      service.createDraft.mockResolvedValue(failure(409, 'Conflicto', { conflictField }));
      const { result } = await renderFlow();

      await act(() => result.current.handleStep1Submit(submitEvent));

      expect(result.current.errorModal.recommendation).toContain(expected);
    });

    it('usa la recomendación general si el conflicto no indica el campo', async () => {
      service.createDraft.mockResolvedValue(
        failure(400, 'Conflicto', { code: 'COMPANY_REGISTRATION_CONFLICT' }),
      );
      const { result } = await renderFlow();

      await act(() => result.current.handleStep1Submit(submitEvent));

      expect(result.current.errorModal.category).toBe('conflict');
      expect(result.current.errorModal.recommendation).toContain('coinciden con registros ya existentes');
    });

    it('muestra el modal de servidor y no avanza al recibir un 500', async () => {
      service.createDraft.mockResolvedValue(failure(500, 'Error interno'));
      const { result } = await renderFlow();

      await act(() => result.current.handleStep1Submit(submitEvent));

      expect(result.current.step).toBe(1);
      expect(result.current.errorModal).toMatchObject({
        open: true,
        category: 'server',
        title: 'Inconveniente temporal en la plataforma',
        message: 'Error interno',
      });
    });

    it('muestra el modal de conexión y no avanza ante un error de red', async () => {
      service.createDraft.mockResolvedValue(failure(0, 'Network Error'));
      const { result } = await renderFlow();

      await act(() => result.current.handleStep1Submit(submitEvent));

      expect(result.current.step).toBe(1);
      expect(result.current.errorModal).toMatchObject({
        open: true,
        category: 'network',
        title: 'Problema de conexión con el servicio',
      });
    });

    it('muestra el modal de validación ante un 400', async () => {
      service.createDraft.mockResolvedValue(failure(400, 'Teléfono inválido'));
      const { result } = await renderFlow();

      await act(() => result.current.handleStep1Submit(submitEvent));

      expect(result.current.errorModal).toMatchObject({
        open: true,
        category: 'validation',
        title: 'Revisa los campos del formulario',
        message: 'Teléfono inválido',
      });
    });

    it('permite cerrar el modal de errores', async () => {
      service.createDraft.mockResolvedValue(failure(500, 'Error'));
      const { result } = await renderFlow();
      await act(() => result.current.handleStep1Submit(submitEvent));

      act(() => result.current.setErrorModal({ ...result.current.errorModal, open: false }));

      expect(result.current.errorModal.open).toBe(false);
    });

    it('no avanza si la subida del logo falla', async () => {
      service.createDraft.mockResolvedValue({ ok: true, data: { id: 'draft-1' } });
      service.uploadLogo.mockResolvedValue(failure(400, 'El logo debe estar en formato PNG o JPG'));
      const { result } = await renderFlow();
      act(() => result.current.handleLogoChange(changeEvent(fileOf('image/png'))));

      await act(() => result.current.handleStep1Submit(submitEvent));

      expect(result.current.step).toBe(1);
      expect(result.current.submitting).toBe(false);
      expect(result.current.error).toBe('El logo debe estar en formato PNG o JPG');
      expect(result.current.errorModal).toMatchObject({ open: true, category: 'validation' });
    });
  });

  describe('paso 2: carta y envío', () => {
    async function flowAtStepTwo() {
      service.createDraft.mockResolvedValue({ ok: true, data: { id: 'draft-1' } });
      const hook = await renderFlow();
      fillForm(hook.result);
      await act(() => hook.result.current.handleStep1Submit(submitEvent));
      return hook;
    }

    it('exige adjuntar la carta antes de enviar', async () => {
      const { result } = await flowAtStepTwo();

      await act(() => result.current.handleStep2Submit(submitEvent));

      expect(service.uploadDocument).not.toHaveBeenCalled();
      expect(result.current.error).toBe('Debes adjuntar la carta de solicitud en hoja membretada.');
      expect(result.current.errorModal).toMatchObject({ open: true, category: 'validation' });
      expect(result.current.step).toBe(2);
    });

    it('exige un borrador creado aunque haya carta', async () => {
      const { result } = await renderFlow();
      act(() => result.current.handleDocumentSelected(fileOf('application/pdf')));

      await act(() => result.current.handleStep2Submit(submitEvent));

      expect(service.uploadDocument).not.toHaveBeenCalled();
      expect(result.current.error).toBe('Debes adjuntar la carta de solicitud en hoja membretada.');
    });

    it('no avanza si la subida de la carta falla', async () => {
      service.uploadDocument.mockResolvedValue(failure(413, 'El archivo supera 10 MB'));
      const { result } = await flowAtStepTwo();
      act(() => result.current.handleDocumentSelected(fileOf('application/pdf')));

      await act(() => result.current.handleStep2Submit(submitEvent));

      expect(service.submit).not.toHaveBeenCalled();
      expect(result.current.step).toBe(2);
      expect(result.current.submitting).toBe(false);
      expect(result.current.error).toBe('El archivo supera 10 MB');
      expect(result.current.errorModal).toMatchObject({ open: true, category: 'validation' });
    });

    it('no avanza si el envío final falla', async () => {
      service.uploadDocument.mockResolvedValue({ ok: true, data: { id: 'draft-1', documentFileId: 'doc-1' } });
      service.submit.mockResolvedValue(failure(500, 'No se pudo enviar'));
      const { result } = await flowAtStepTwo();
      act(() => result.current.handleDocumentSelected(fileOf('application/pdf')));

      await act(() => result.current.handleStep2Submit(submitEvent));

      expect(result.current.step).toBe(2);
      expect(result.current.submitted).toBeNull();
      expect(result.current.errorModal.category).toBe('server');
    });

    it('envía la solicitud, guarda el código de seguimiento y pasa al paso 3', async () => {
      const carta = fileOf('application/pdf', 1024, 'carta.pdf');
      service.uploadDocument.mockResolvedValue({ ok: true, data: { id: 'draft-1', documentFileId: 'doc-1' } });
      service.submit.mockResolvedValue({
        ok: true,
        data: { id: 'draft-1', requestCode: 'EMP-2026-0001', status: 'PENDING', submittedAt: '2026-11-25T12:00:00.000Z' },
      });
      const { result } = await flowAtStepTwo();
      act(() => result.current.handleDocumentSelected(carta));

      await act(() => result.current.handleStep2Submit(submitEvent));

      expect(service.uploadDocument).toHaveBeenCalledWith('draft-1', carta);
      expect(service.submit).toHaveBeenCalledWith('draft-1');
      expect(result.current.step).toBe(3);
      expect(result.current.submitted?.requestCode).toBe('EMP-2026-0001');
      expect(result.current.submitting).toBe(false);
    });

    it('vuelve al paso 1 conservando los datos del formulario', async () => {
      const { result } = await flowAtStepTwo();

      act(() => result.current.setStep(1));

      expect(result.current.step).toBe(1);
      expect(result.current.form).toMatchObject({
        companyName: 'TecnoAndes',
        email: 'rrhh@tecnoandes.bo',
        username: 'tecnoandes',
        cityId: 'city-1',
      });
    });
  });

  describe('copiar el código de seguimiento', () => {
    it('copia el código con el portapapeles y deja de mostrarlo como copiado a los 2 s', async () => {
      const writeText = vi.fn().mockResolvedValue(undefined);
      vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } });
      const { result } = await renderFlow();
      vi.useFakeTimers();

      await act(() => result.current.handleCopyCode('EMP-2026-0001'));

      expect(writeText).toHaveBeenCalledWith('EMP-2026-0001');
      expect(result.current.copiedCode).toBe(true);

      act(() => {
        vi.advanceTimersByTime(2000);
      });
      expect(result.current.copiedCode).toBe(false);
    });

    it('usa la copia manual si el portapapeles falla', async () => {
      const writeText = vi.fn().mockRejectedValue(new Error('denegado'));
      vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } });
      const execCommand = vi.fn().mockReturnValue(true);
      Object.assign(document, { execCommand });
      const { result } = await renderFlow();

      await act(() => result.current.handleCopyCode('EMP-2026-0002'));

      expect(execCommand).toHaveBeenCalledWith('copy');
      expect(result.current.copiedCode).toBe(true);
      expect(document.querySelector('input[value="EMP-2026-0002"]')).toBeNull();
    });
  });
});
