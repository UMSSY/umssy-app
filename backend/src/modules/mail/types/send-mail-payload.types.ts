export interface SendMailPayload {
  to: string;
  subject: string;
  text: string;
  mjml: string;
  values?: Record<string, string>;
}
