// Clase base abstracta para todas las excepciones de negocio.
export abstract class DomainException extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
  ) {
    super(message);
    this.name = new.target.name;
  }
}
