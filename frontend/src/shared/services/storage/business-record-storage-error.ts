export class BusinessRecordStorageError extends Error {
  constructor(cause: unknown, message = "No se pudo acceder al almacenamiento persistente del navegador. Habilítalo y vuelve a intentar. No se enviará una nueva solicitud sin guardar antes su clave de reintento.") {
    super(message, { cause });
    this.name = "BusinessRecordStorageError";
  }
}
