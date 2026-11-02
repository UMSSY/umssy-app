export interface RejectionMailContext {
  readonly accessRequestId: string;
}

export interface RejectionMailLink {
  requestCode: string;
  url: string;
}
