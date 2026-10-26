// frontend/src/shared/utils/api-error-detail.ts
export function getErrorMessage(error: unknown, defaultMessage: string): string {
  if (error instanceof Error) {
    return error.message;
  }
  // Si el backend devuelve un objeto con una propiedad 'message', puedes manejarlo aquí
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String((error as { message: unknown }).message);
  }
  return defaultMessage;
}