"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  companyAccessRequestService,
  type CompanyAccessRequestItem,
  type UpdateCompanyPayload,
} from "@/modules/access-requests";
import {
  COMPANY_CORRECTION_REASONS,
  COMPANY_REJECTION_REASONS,
} from "../constants/company-request.constants";
import type { CompanyLogoBg } from "../types/company-logo-bg.types";
import type { CompanyResolutionAction } from "../types/company-resolution-action.types";

function toFormPayload(data: CompanyAccessRequestItem): UpdateCompanyPayload {
  return {
    companyName: data.companyName,
    sector: data.sector,
    description: data.description,
    email: data.email,
    phone: data.phone,
    websiteUrl: data.websiteUrl ?? "",
    username: data.username,
  };
}

export function useCompanyRequestDetail(id: string) {
  const router = useRouter();
  const [item, setItem] = useState<CompanyAccessRequestItem | null>(null);
  const [docUrl, setDocUrl] = useState<string | null>(null);
  const [docIsImage, setDocIsImage] = useState(false);
  const [docMimeType, setDocMimeType] = useState("application/pdf");
  const [docError, setDocError] = useState<string | null>(null);
  const [retryingDoc, setRetryingDoc] = useState(false);

  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [retryingLogo, setRetryingLogo] = useState(false);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showResolutionModal, setShowResolutionModal] = useState(false);
  const [activeAction, setActiveAction] =
    useState<CompanyResolutionAction | null>(null);
  const [showLogoModal, setShowLogoModal] = useState(false);
  const [logoBg, setLogoBg] = useState<CompanyLogoBg>("light");

  const [correctionCategory, setCorrectionCategory] = useState<string>(
    COMPANY_CORRECTION_REASONS[0],
  );
  const [correctionDetails, setCorrectionDetails] = useState("");
  const [rejectionCategory, setRejectionCategory] = useState<string>(
    COMPANY_REJECTION_REASONS[0],
  );
  const [rejectionDetails, setRejectionDetails] = useState("");

  const [isEditingFicha, setIsEditingFicha] = useState(false);
  const [editForm, setEditForm] = useState<UpdateCompanyPayload>({});
  const [initialSnapshot, setInitialSnapshot] =
    useState<UpdateCompanyPayload | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [reEvaluatingOcr, setReEvaluatingOcr] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const docUrlRef = useRef<string | null>(null);
  const logoUrlRef = useRef<string | null>(null);

  const applyDocumentBlob = useCallback((docBlob: Blob | null) => {
    if (docUrlRef.current) {
      URL.revokeObjectURL(docUrlRef.current);
      docUrlRef.current = null;
    }
    if (!docBlob) {
      setDocUrl(null);
      return;
    }
    const created = URL.createObjectURL(docBlob);
    docUrlRef.current = created;
    const isImg = docBlob.type.startsWith("image/");
    setDocIsImage(isImg);
    setDocMimeType(docBlob.type || (isImg ? "image/png" : "application/pdf"));
    setDocUrl(created);
  }, []);

  const applyLogoBlob = useCallback((logoBlob: Blob | null) => {
    if (logoUrlRef.current) {
      URL.revokeObjectURL(logoUrlRef.current);
      logoUrlRef.current = null;
    }
    if (!logoBlob) {
      setLogoUrl(null);
      return;
    }
    const created = URL.createObjectURL(logoBlob);
    logoUrlRef.current = created;
    setLogoUrl(created);
  }, []);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const detailRes = await companyAccessRequestService.getDetail(id);
        if (!active) return;

        if (!detailRes.ok) {
          setError(detailRes.message);
          return;
        }
        setItem(detailRes.data);
        const formPayload = toFormPayload(detailRes.data);
        setEditForm(formPayload);
        setInitialSnapshot((prev) => prev ?? { ...formPayload });

        const [docResult, logoResult] = await Promise.allSettled([
          companyAccessRequestService.getDocumentBlob(id),
          companyAccessRequestService.getLogoBlob(id),
        ]);

        if (!active) return;

        if (docResult.status === "fulfilled") {
          setDocError(null);
          applyDocumentBlob(docResult.value);
        } else {
          setDocUrl(null);
          setDocError(
            docResult.reason instanceof Error
              ? docResult.reason.message
              : "No se pudo descargar la carta membretada adjunta.",
          );
        }

        if (logoResult.status === "fulfilled") {
          setLogoError(null);
          applyLogoBlob(logoResult.value);
        } else {
          setLogoUrl(null);
          setLogoError(
            logoResult.reason instanceof Error
              ? logoResult.reason.message
              : "No se pudo descargar el logotipo adjunto.",
          );
        }
      } catch {
        if (active) setError("No se pudo cargar el expediente.");
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
      if (docUrlRef.current) URL.revokeObjectURL(docUrlRef.current);
      if (logoUrlRef.current) URL.revokeObjectURL(logoUrlRef.current);
    };
  }, [id, applyDocumentBlob, applyLogoBlob]);

  const retryDocument = useCallback(async () => {
    setRetryingDoc(true);
    try {
      const blob = await companyAccessRequestService.getDocumentBlob(id);
      setDocError(null);
      applyDocumentBlob(blob);
    } catch (err) {
      setDocError(
        err instanceof Error
          ? err.message
          : "No se pudo descargar la carta membretada adjunta.",
      );
    } finally {
      setRetryingDoc(false);
    }
  }, [id, applyDocumentBlob]);

  const retryLogo = useCallback(async () => {
    setRetryingLogo(true);
    try {
      const blob = await companyAccessRequestService.getLogoBlob(id);
      setLogoError(null);
      applyLogoBlob(blob);
    } catch (err) {
      setLogoError(
        err instanceof Error
          ? err.message
          : "No se pudo descargar el logotipo adjunto.",
      );
    } finally {
      setRetryingLogo(false);
    }
  }, [id, applyLogoBlob]);

  async function refreshItem() {
    const refreshed = await companyAccessRequestService.getDetail(id);
    if (refreshed.ok) {
      setItem(refreshed.data);
      return refreshed.data;
    }
    return null;
  }

  async function handleApprove() {
    setSubmitting(true);
    setError(null);
    const res = await companyAccessRequestService.approve(id);
    setSubmitting(false);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    setShowResolutionModal(false);
    router.push("/backoffice/empresas");
  }

  async function handleCorrection() {
    if (correctionDetails.trim().length < 5) return;
    setSubmitting(true);
    setError(null);
    const res = await companyAccessRequestService.requestCorrection(id, {
      reasonCategory: correctionCategory,
      customDetails: correctionDetails.trim(),
    });
    setSubmitting(false);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    setActiveAction(null);
    setShowResolutionModal(false);
    setSuccessMessage(
      "Se ha notificado a la empresa la solicitud de subsanación por correo electrónico.",
    );
    await refreshItem();
  }

  async function handleReject() {
    if (rejectionDetails.trim().length < 5) return;
    setSubmitting(true);
    setError(null);
    const res = await companyAccessRequestService.reject(id, {
      reasonCategory: rejectionCategory,
      customDetails: rejectionDetails.trim(),
    });
    setSubmitting(false);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    setShowResolutionModal(false);
    router.push("/backoffice/empresas");
  }

  async function handleSaveEdit() {
    setIsSavingEdit(true);
    setError(null);
    const res = await companyAccessRequestService.updateDraft(id, editForm);
    setIsSavingEdit(false);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    setIsEditingFicha(false);
    setSuccessMessage(
      "Ficha oficial actualizada y contraste OCR recalculado exitosamente.",
    );
    const data = await refreshItem();
    if (data) setEditForm(toFormPayload(data));
  }

  async function handleResetInitialData() {
    if (!initialSnapshot) return;
    const initial = initialSnapshot;
    setEditForm({ ...initial });

    const isDifferentFromSaved =
      item?.companyName !== initial.companyName ||
      item?.sector !== initial.sector ||
      item?.email !== initial.email ||
      item?.phone !== initial.phone ||
      (item?.websiteUrl ?? "") !== (initial.websiteUrl ?? "") ||
      item?.description !== initial.description ||
      item?.username !== initial.username;

    if (isDifferentFromSaved) {
      setIsSavingEdit(true);
      setError(null);
      const res = await companyAccessRequestService.updateDraft(id, initial);
      setIsSavingEdit(false);
      if (!res.ok) {
        setError(res.message);
        return;
      }
      await refreshItem();
      setIsEditingFicha(false);
      setSuccessMessage(
        "Los datos se han restablecido a los valores iniciales del registro original.",
      );
    } else {
      setIsEditingFicha(false);
      setSuccessMessage(
        "Los campos se han restablecido a sus valores originales.",
      );
    }
  }

  async function handleReEvaluateOcr() {
    setReEvaluatingOcr(true);
    setError(null);
    const res = await companyAccessRequestService.reEvaluateOcr(id);
    setReEvaluatingOcr(false);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    setSuccessMessage(
      "Contraste OCR recalculado y datos del documento extraídos exitosamente.",
    );
    await refreshItem();
  }

  const isDataModifiedFromInitial =
    Boolean(item) &&
    Boolean(initialSnapshot) &&
    (item!.companyName !== initialSnapshot?.companyName ||
      item!.sector !== initialSnapshot?.sector ||
      item!.email !== initialSnapshot?.email ||
      item!.phone !== initialSnapshot?.phone ||
      (item!.websiteUrl ?? "") !== (initialSnapshot?.websiteUrl ?? "") ||
      item!.description !== initialSnapshot?.description ||
      item!.username !== initialSnapshot?.username);

  return {
    item,
    docUrl,
    docIsImage,
    docMimeType,
    docError,
    retryingDoc,
    retryDocument,
    logoUrl,
    logoError,
    retryingLogo,
    retryLogo,
    loading,
    submitting,
    showResolutionModal,
    setShowResolutionModal,
    activeAction,
    setActiveAction,
    showLogoModal,
    setShowLogoModal,
    logoBg,
    setLogoBg,
    correctionCategory,
    setCorrectionCategory,
    correctionDetails,
    setCorrectionDetails,
    rejectionCategory,
    setRejectionCategory,
    rejectionDetails,
    setRejectionDetails,
    isEditingFicha,
    setIsEditingFicha,
    editForm,
    setEditForm,
    isSavingEdit,
    reEvaluatingOcr,
    error,
    setError,
    successMessage,
    setSuccessMessage,
    isDataModifiedFromInitial,
    handleApprove,
    handleCorrection,
    handleReject,
    handleSaveEdit,
    handleResetInitialData,
    handleReEvaluateOcr,
  };
}
