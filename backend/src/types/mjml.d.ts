declare module 'mjml' {
  interface MjmlError {
    line: number;
    message: string;
    tagName: string;
    formattedMessage: string;
  }
  interface MjmlResult {
    html: string;
    errors: MjmlError[];
  }
  export default function mjml2html(mjml: string, options?: Record<string, unknown>): MjmlResult;
}
