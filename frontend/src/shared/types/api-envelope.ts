// Formato estándar de las respuestas exitosas del backend
export interface ApiEnvelope<T> {
  statusCode: number;
  ok: boolean;
  detail: string;
  data: T;
}
