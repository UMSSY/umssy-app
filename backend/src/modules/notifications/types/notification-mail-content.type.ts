export interface NotificationMailContent {
  mjml: string;
  subject: string;
  text: string;
  values: Record<string, string>;
}
