'use client';

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type FormEvent,
} from 'react';
import { companyAccessRequestService } from '../services/company-access-request.service';
import type {
  CityItem,
  CreateCompanyRequestPayload,
  SubmitCompanyRequestResult,
} from '../types/company-access-request.types';
import type { CompanyFlowErrorModalState } from '../types/company-flow-error-modal.types';
import type { CompanyFlowStepNumber } from '../types/company-flow-step.types';
import type { CompanyLogoDimensions } from '../types/company-logo-dimensions.types';

const ALLOWED_LOGO_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

const CONFLICT_RECOMMENDATIONS: Record<string, string> = {
  email:
    'Para garantizar la seguridad institucional de cada cuenta, cada usuario debe registrarse con un correo electrónico único. Si ya cuentas con acceso previo, por favor inicia sesión. De lo contrario, utiliza una dirección de correo corporativa diferente.',
  companyName:
    'La empresa indicada ya se encuentra registrada en la plataforma. Si perteneces a esta organización, solicita al administrador de tu empresa que te agregue como reclutador o comunícate con la administración de UMSSy.',
  activeRequest:
    'Actualmente existe una solicitud en proceso de evaluación con estos datos. El equipo de administración de UMSSy la revisará en un plazo máximo de 48 horas hábiles y te notificará por correo electrónico.',
};

function buildErrorModalState(result: {
  status: number;
  message: string;
  code?: string;
  conflictField?: 'email' | 'companyName' | 'activeRequest';
}): CompanyFlowErrorModalState {
  if (result.status === 409 || result.code === 'COMPANY_REGISTRATION_CONFLICT') {
    return {
      open: true,
      category: 'conflict',
      title: 'Registro no disponible: Información ya existente',
      message: result.message,
      field: result.conflictField,
      recommendation:
        (result.conflictField && CONFLICT_RECOMMENDATIONS[result.conflictField]) ??
        'Los datos ingresados coinciden con registros ya existentes en el sistema. Por favor revisa la información o contacta a soporte.',
    };
  }

  if (result.status === 0) {
    return {
      open: true,
      category: 'network',
      title: 'Problema de conexión con el servicio',
      message: result.message,
      field: result.conflictField,
      recommendation:
        'No logramos establecer comunicación con los servidores en este momento. Por favor verifica tu conexión a internet o intenta enviar el formulario nuevamente en unos minutos.',
    };
  }

  if (result.status >= 500) {
    return {
      open: true,
      category: 'server',
      title: 'Inconveniente temporal en la plataforma',
      message: result.message,
      field: result.conflictField,
      recommendation:
        'Nuestros servidores experimentaron un problema momentáneo al procesar tu solicitud. Tus datos están a salvo. Por favor intenta nuevamente en unos momentos.',
    };
  }

  return {
    open: true,
    category: 'validation',
    title: 'Revisa los campos del formulario',
    message: result.message,
    field: result.conflictField,
    recommendation:
      'Verifica que todos los campos requeridos hayan sido completados respetando los formatos indicados.',
  };
}

export function useCompanyAccessRequestFlow() {
  const [step, setStep] = useState<CompanyFlowStepNumber>(1);
  const [cities, setCities] = useState<CityItem[]>([]);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<SubmitCompanyRequestResult | null>(
    null,
  );
  const [copiedCode, setCopiedCode] = useState(false);
  const [form, setForm] = useState<CreateCompanyRequestPayload>({
    companyName: '',
    sector: '',
    cityId: '',
    description: '',
    email: '',
    phone: '',
    websiteUrl: '',
    username: '',
  });

  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoDimensions, setLogoDimensions] =
    useState<CompanyLogoDimensions | null>(null);
  const [isLogoDragging, setIsLogoDragging] = useState(false);
  const [isLogoModalOpen, setIsLogoModalOpen] = useState(false);
  const [previewBg, setPreviewBg] = useState<'light' | 'dark'>('light');

  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [documentPreviewUrl, setDocumentPreviewUrl] = useState<string | null>(
    null,
  );
  const [documentError, setDocumentError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorModal, setErrorModal] = useState<CompanyFlowErrorModalState>({
    open: false,
    title: '',
    category: 'validation',
    message: '',
    recommendation: '',
  });

  useEffect(() => {
    return () => {
      if (documentPreviewUrl) URL.revokeObjectURL(documentPreviewUrl);
    };
  }, [documentPreviewUrl]);

  useEffect(() => {
    void companyAccessRequestService.getCities().then((res) => {
      if (res.ok && Array.isArray(res.data)) {
        setCities(res.data);
        if (res.data.length > 0) {
          setForm((prev) => ({
            ...prev,
            cityId: prev.cityId || res.data[0].id,
          }));
        }
      }
    });
  }, []);

  useEffect(() => {
    return () => {
      if (logoPreview) URL.revokeObjectURL(logoPreview);
    };
  }, [logoPreview]);

  useEffect(() => {
    if (!isLogoModalOpen) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsLogoModalOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLogoModalOpen]);

  async function handleCopyCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      const input = document.createElement('input');
      input.value = code;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
    }
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  }

  function processSelectedLogo(file: File) {
    if (!ALLOWED_LOGO_TYPES.includes(file.type)) {
      setError(
        'Formato no válido para el logo. Solo se permiten imágenes PNG, JPG o WEBP.',
      );
      if (logoInputRef.current) logoInputRef.current.value = '';
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('El logo no debe superar los 2 MB.');
      if (logoInputRef.current) logoInputRef.current.value = '';
      return;
    }

    setError(null);
    if (logoPreview) URL.revokeObjectURL(logoPreview);
    const objectUrl = URL.createObjectURL(file);
    setLogoFile(file);
    setLogoPreview(objectUrl);
    setLogoDimensions(null);

    const img = new window.Image();
    img.onload = () => {
      setLogoDimensions({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.src = objectUrl;
  }

  function handleLogoChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processSelectedLogo(file);
  }

  function handleLogoDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsLogoDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processSelectedLogo(file);
  }

  function handleRemoveLogo() {
    if (logoPreview) URL.revokeObjectURL(logoPreview);
    setLogoFile(null);
    setLogoPreview(null);
    setLogoDimensions(null);
    setIsLogoModalOpen(false);
    if (logoInputRef.current) logoInputRef.current.value = '';
  }

  function handleDocumentSelected(file: File) {
    if (!ALLOWED_DOCUMENT_TYPES.includes(file.type)) {
      setDocumentError(
        'Formato no permitido. Solo se aceptan archivos JPG, PNG o PDF.',
      );
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setDocumentError('El archivo supera el máximo de 10 MB.');
      return;
    }
    setDocumentError(null);
    setError(null);
    if (documentPreviewUrl) URL.revokeObjectURL(documentPreviewUrl);
    setDocumentFile(file);
    setDocumentPreviewUrl(URL.createObjectURL(file));
  }

  function handleRemoveDocument() {
    if (documentPreviewUrl) URL.revokeObjectURL(documentPreviewUrl);
    setDocumentFile(null);
    setDocumentPreviewUrl(null);
    setDocumentError(null);
  }

  async function handleStep1Submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const created = await companyAccessRequestService.createDraft({
      ...form,
      websiteUrl: (form.websiteUrl ?? '').trim(),
    });
    if (!created.ok) {
      setError(created.message);
      setErrorModal(buildErrorModalState(created));
      setSubmitting(false);
      return;
    }

    const id = created.data.id;
    setDraftId(id);

    if (logoFile) {
      const logoRes = await companyAccessRequestService.uploadLogo(
        id,
        logoFile,
      );
      if (!logoRes.ok) {
        setError(logoRes.message);
        setErrorModal(buildErrorModalState(logoRes));
        setSubmitting(false);
        return;
      }
    }

    setSubmitting(false);
    setStep(2);
  }

  async function handleStep2Submit(e: FormEvent) {
    e.preventDefault();
    if (!draftId || !documentFile) {
      const message = 'Debes adjuntar la carta de solicitud en hoja membretada.';
      setError(message);
      setErrorModal(buildErrorModalState({ status: 400, message }));
      return;
    }
    setError(null);
    setSubmitting(true);

    const uploadRes = await companyAccessRequestService.uploadDocument(
      draftId,
      documentFile,
    );
    if (!uploadRes.ok) {
      setError(uploadRes.message);
      setErrorModal(buildErrorModalState(uploadRes));
      setSubmitting(false);
      return;
    }

    const submitRes = await companyAccessRequestService.submit(draftId);
    setSubmitting(false);
    if (!submitRes.ok) {
      setError(submitRes.message);
      setErrorModal(buildErrorModalState(submitRes));
      return;
    }

    setSubmitted(submitRes.data);
    setStep(3);
  }

  return {
    step,
    setStep,
    cities,
    submitted,
    copiedCode,
    handleCopyCode,
    form,
    setForm,
    logoInputRef,
    logoFile,
    logoPreview,
    logoDimensions,
    isLogoDragging,
    setIsLogoDragging,
    isLogoModalOpen,
    setIsLogoModalOpen,
    previewBg,
    setPreviewBg,
    handleLogoChange,
    handleLogoDrop,
    handleRemoveLogo,
    documentFile,
    documentPreviewUrl,
    documentError,
    handleDocumentSelected,
    handleRemoveDocument,
    error,
    submitting,
    errorModal,
    setErrorModal,
    handleStep1Submit,
    handleStep2Submit,
  };
}
