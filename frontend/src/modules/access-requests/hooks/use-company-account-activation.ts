'use client';

import { useEffect, useState, useTransition, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { companyAccessRequestService } from '../services/company-access-request.service';
import type { CompanyOfficialData } from '../types/company-access-request.types';
import type { CompanyActivationState } from '../types/company-activation-state.types';
import type { CompanyReportStatus } from '../types/company-report-status.types';

export function useCompanyAccountActivation() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get('email')?.trim().toLowerCase() ?? '';
  const otpParam =
    searchParams.get('otp')?.trim() ?? searchParams.get('token')?.trim() ?? '';
  const codeParam = searchParams.get('code')?.trim().toUpperCase() ?? '';

  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<CompanyActivationState>('LOADING');
  const [serverMessage, setServerMessage] = useState('');
  const [officialData, setOfficialData] = useState<CompanyOfficialData | null>(
    null,
  );

  const [trackingCode, setTrackingCode] = useState(codeParam);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [isVerifyingCode, startVerifyCode] = useTransition();

  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportObservation, setReportObservation] = useState('');
  const [reportStatus, setReportStatus] =
    useState<CompanyReportStatus>('idle');
  const [reportMessage, setReportMessage] = useState('');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [activationError, setActivationError] = useState<string | null>(null);

  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const isPasswordValid = hasMinLength && hasUppercase && hasNumber;
  const passwordsMatch =
    confirmPassword.length > 0 && password === confirmPassword;
  const canFinalize =
    isPasswordValid && passwordsMatch && !isActivating && officialData !== null;

  useEffect(() => {
    async function checkStatus() {
      if (!emailParam) {
        setState('INVALID');
        setServerMessage(
          'Debe acceder a este apartado mediante el enlace oficial enviado a su correo electrónico.',
        );
        setLoading(false);
        return;
      }

      setLoading(true);
      const res = await companyAccessRequestService.getActivationStatus({
        email: emailParam,
        code: codeParam || undefined,
        otp: otpParam || undefined,
      });

      if (!res.ok) {
        setState('INVALID');
        setServerMessage(
          res.message || 'No se pudo verificar el estado de la solicitud.',
        );
        setLoading(false);
        return;
      }

      const result = res.data;
      if (result.state === 'READY' && result.data) {
        setOfficialData(result.data);
        setState('READY');
      } else if (result.state === 'ALREADY_ACTIVATED') {
        setState('ALREADY_ACTIVATED');
        setServerMessage(
          result.message || 'Esta cuenta institucional ya ha sido activada.',
        );
      } else if (result.state === 'EXPIRED') {
        setState('EXPIRED');
        setServerMessage(
          result.message ||
            'El enlace o código de activación ha expirado (plazo de 24 horas vencido).',
        );
      } else if (
        result.state === 'REQUIRES_CODE' ||
        result.state === 'INVALID_CODE'
      ) {
        setState('REQUIRES_CODE');
        setServerMessage(result.message || '');
      } else {
        setState(result.state);
        setServerMessage(
          result.message ||
            'La solicitud no se encuentra en estado apto para activación.',
        );
      }
      setLoading(false);
    }

    void checkStatus();
  }, [emailParam, codeParam, otpParam]);

  function handleVerifyCode(e: FormEvent) {
    e.preventDefault();
    if (!trackingCode.trim()) {
      setCodeError('Ingrese el código de seguimiento de su solicitud.');
      return;
    }

    setCodeError(null);
    startVerifyCode(async () => {
      const res = await companyAccessRequestService.getActivationStatus({
        email: emailParam,
        code: trackingCode.trim().toUpperCase(),
        otp: otpParam || undefined,
      });

      if (!res.ok) {
        setCodeError(
          res.message || 'Error al verificar el código de seguimiento.',
        );
        return;
      }

      const result = res.data;
      if (result.state === 'READY' && result.data) {
        setOfficialData(result.data);
        setState('READY');
      } else if (result.state === 'INVALID_CODE') {
        setCodeError(
          result.message ||
            'El código de seguimiento no coincide con la solicitud registrada.',
        );
      } else if (result.state === 'ALREADY_ACTIVATED') {
        setState('ALREADY_ACTIVATED');
      } else if (result.state === 'EXPIRED') {
        setState('EXPIRED');
      } else {
        setCodeError(result.message || 'No se pudo validar el código.');
      }
    });
  }

  async function handleSendReport() {
    if (!reportObservation.trim() || reportObservation.trim().length < 5) {
      setReportMessage(
        'Por favor describa la observación con al menos 5 caracteres.',
      );
      setReportStatus('error');
      return;
    }

    setReportStatus('sending');
    const res = await companyAccessRequestService.reportInconsistency({
      requestCode: officialData?.requestCode || trackingCode,
      email: emailParam,
      observation: reportObservation.trim(),
    });

    if (res.ok) {
      setReportStatus('success');
      setReportMessage(
        'Su observación fue registrada formalmente para revisión administrativa.',
      );
      setTimeout(() => {
        setIsReportOpen(false);
        setReportObservation('');
        setReportStatus('idle');
      }, 2000);
    } else {
      setReportStatus('error');
      setReportMessage(
        res.message || 'No se pudo registrar el reporte de inconsistencia.',
      );
    }
  }

  async function handleConfirmActivation() {
    if (!officialData || !canFinalize) return;

    setIsActivating(true);
    setActivationError(null);

    const res = await companyAccessRequestService.activateAccount({
      requestCode: officialData.requestCode,
      email: officialData.email,
      code: otpParam,
      password,
    });

    if (res.ok) {
      setIsConfirmModalOpen(false);
      setState('SUCCESS');
    } else {
      setActivationError(
        res.message ||
          'No se pudo completar la activación. Verifique que el código no haya expirado.',
      );
      setIsActivating(false);
    }
  }

  return {
    goToLogin: () => router.push('/login'),
    loading,
    state,
    serverMessage,
    officialData,
    trackingCode,
    setTrackingCode,
    codeError,
    setCodeError,
    isVerifyingCode,
    handleVerifyCode,
    isReportOpen,
    setIsReportOpen,
    reportObservation,
    setReportObservation,
    reportStatus,
    reportMessage,
    handleSendReport,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    showPassword,
    setShowPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    hasMinLength,
    hasUppercase,
    hasNumber,
    passwordsMatch,
    canFinalize,
    isConfirmModalOpen,
    setIsConfirmModalOpen,
    isActivating,
    activationError,
    handleConfirmActivation,
  };
}
