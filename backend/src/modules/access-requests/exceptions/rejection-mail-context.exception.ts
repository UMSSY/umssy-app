export class RejectionMailContextException extends Error {
  constructor() {
    super('No se pudo preparar el correo de revisión.');
    this.name = 'RejectionMailContextException';
  }
}
