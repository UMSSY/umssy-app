export abstract class DomainException extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
    readonly code: string,
    readonly data: unknown = null,
  ) {
    super(message);
    this.name = new.target.name;
  }
}
