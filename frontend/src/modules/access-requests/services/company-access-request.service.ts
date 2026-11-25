import { apiClient } from '@/shared/services/api-client';
import type { ApiResult } from '../types/api-result.types';
import type {
  ActivateCompanyAccountPayload,
  CityItem,
  CompanyAccessRequestItem,
  CompanyActivationStatusResult,
  CompanyRequestsSummary,
  CreateCompanyRequestPayload,
  RejectCompanyPayload,
  ReportInconsistencyPayload,
  RequestCorrectionPayload,
  SubmitCompanyRequestResult,
  UpdateCompanyPayload,
} from '../types/company-access-request.types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function unwrap<T>(raw: unknown): T {
  if (isRecord(raw) && 'data' in raw && raw.data !== undefined) {
    return raw.data as T;
  }
  return raw as T;
}

function extractErrorMessage(body: unknown, fallback: string): string {
  if (!isRecord(body)) return fallback;
  if (typeof body.detail === 'string') return body.detail;
  if (typeof body.message === 'string') return body.message;
  if (Array.isArray(body.message) && body.message.length > 0) {
    const first = body.message[0];
    if (isRecord(first) && typeof first.message === 'string') {
      return first.message;
    }
  }
  return fallback;
}

async function request<T>(
  method: 'get' | 'post' | 'patch',
  url: string,
  data?: unknown,
  params?: Record<string, string | number | undefined>,
): Promise<ApiResult<T>> {
  try {
    const response = await apiClient.request({
      method,
      url,
      data,
      params,
      validateStatus: () => true,
    });
    if (response.status >= 200 && response.status < 300) {
      return { ok: true, data: unwrap<T>(response.data) };
    }
    const errorBody = isRecord(response.data) ? response.data : null;
    const errorData = errorBody && isRecord(errorBody.data) ? errorBody.data : null;
    const conflictField =
      errorData &&
      typeof errorData.field === 'string' &&
      (errorData.field === 'email' ||
        errorData.field === 'companyName' ||
        errorData.field === 'activeRequest')
        ? errorData.field
        : undefined;
    const errorCode =
      errorBody && typeof errorBody.code === 'string'
        ? errorBody.code
        : undefined;

    return {
      ok: false,
      status: response.status,
      fieldErrors: {},
      message: extractErrorMessage(
        response.data,
        'No se pudo completar la operación.',
      ),
      code: errorCode,
      conflictField,
    };
  } catch {
    return {
      ok: false,
      status: 0,
      fieldErrors: {},
      message: 'Error de conexión con el servidor.',
    };
  }
}

async function fetchAttachmentBlob(
  url: string,
  errorMessage: string,
): Promise<Blob | null> {
  const res = await apiClient.get(url, {
    responseType: 'blob',
    validateStatus: () => true,
  });
  if (res.status === 200) return res.data as Blob;
  if (res.status === 404) return null;
  throw new Error(errorMessage);
}

export const companyAccessRequestService = {
  getCities: () => request<CityItem[]>('get', '/cities'),

  createDraft: (payload: CreateCompanyRequestPayload) =>
    request<{ id: string }>('post', '/company-access-requests', payload),

  uploadLogo: (id: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return request<{ id: string; logoFileId: string }>(
      'post',
      `/company-access-requests/${id}/logo`,
      form,
    );
  },

  uploadDocument: (id: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return request<{ id: string; documentFileId: string }>(
      'post',
      `/company-access-requests/${id}/document`,
      form,
    );
  },

  submit: (id: string) =>
    request<SubmitCompanyRequestResult>(
      'post',
      `/company-access-requests/${id}/submit`,
    ),

  list: (params: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }) =>
    request<{ rows: CompanyAccessRequestItem[]; total: number }>(
      'get',
      '/company-access-requests',
      undefined,
      params,
    ),

  getSummary: () =>
    request<CompanyRequestsSummary>('get', '/company-access-requests/summary'),

  getDetail: (id: string) =>
    request<CompanyAccessRequestItem>('get', `/company-access-requests/${id}`),

  updateDraft: (id: string, payload: UpdateCompanyPayload) =>
    request<CompanyAccessRequestItem>(
      'patch',
      `/company-access-requests/${id}`,
      payload,
    ),

  requestCorrection: (id: string, payload: RequestCorrectionPayload) =>
    request<CompanyAccessRequestItem>(
      'post',
      `/company-access-requests/${id}/request-correction`,
      payload,
    ),

  approve: (id: string) =>
    request<{ id: string; status: string }>(
      'patch',
      `/company-access-requests/${id}/approve`,
    ),

  reject: (id: string, payload: RejectCompanyPayload | string) =>
    request<{ id: string; status: string }>(
      'patch',
      `/company-access-requests/${id}/reject`,
      typeof payload === 'string' ? { reason: payload } : payload,
    ),

  reEvaluateOcr: (id: string) =>
    request<{
      id: string;
      ocrMatchScore: number;
      ocrFieldResults: CompanyAccessRequestItem['ocrFieldResults'];
    }>('post', `/company-access-requests/${id}/re-evaluate-ocr`),

  getDocumentBlob: (id: string): Promise<Blob | null> =>
    fetchAttachmentBlob(
      `/company-access-requests/${id}/document`,
      'No se pudo descargar la carta membretada adjunta.',
    ),

  getLogoBlob: (id: string): Promise<Blob | null> =>
    fetchAttachmentBlob(
      `/company-access-requests/${id}/logo`,
      'No se pudo descargar el logotipo adjunto.',
    ),

  getActivationStatus: (params: {
    email?: string;
    code?: string;
    otp?: string;
  }) =>
    request<CompanyActivationStatusResult>(
      'get',
      '/company-access-requests/activation-status',
      undefined,
      params,
    ),

  reportInconsistency: (payload: ReportInconsistencyPayload) =>
    request<{ reported: boolean; message: string }>(
      'post',
      '/company-access-requests/report-inconsistency',
      payload,
    ),

  activateAccount: (payload: ActivateCompanyAccountPayload) =>
    request<{ requestId: string; activated: boolean }>(
      'post',
      '/company-access-requests/activate',
      payload,
    ),
};
