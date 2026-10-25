import mjml2html from 'mjml';

export interface PasswordResetEmailContext {
  code: string;
  recipientName?: string;
  expirationMinutes?: number;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function renderPasswordResetEmail(context: PasswordResetEmailContext): string {
  const { code, recipientName = 'Usuario', expirationMinutes = 5 } = context;
  const safeRecipientName = escapeHtml(recipientName);

  const mjmlTemplate = `
<mjml>
  <mj-head>
    <mj-title>Recuperación de contraseña - UMSSY</mj-title>
    <mj-font name="Inter" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" />
    <mj-attributes>
      <mj-all font-family="Inter, -apple-system, BlinkMacSystemFont, sans-serif" />
      <mj-text color="#0B1F2E" font-size="15px" line-height="1.6" />
    </mj-attributes>
  </mj-head>
  <mj-body background-color="#F6F7F9">
    <mj-spacer height="24px" />
    <mj-section background-color="#FFFFFF" border-radius="12px" padding="32px 24px">
      <mj-column>
        <mj-text align="center" font-size="26px" font-weight="800" color="#003770" padding-bottom="4px">
          UMSSY
        </mj-text>
        <mj-text align="center" font-size="12px" color="#5B6470" padding-top="0px" padding-bottom="24px">
          Acreditación y comunidad · Universidad Mayor de San Simón
        </mj-text>
        <mj-divider border-color="#E3E7EC" border-width="1px" padding="0 0 24px 0" />

        <mj-text font-size="20px" font-weight="700" color="#0B1F2E" padding-bottom="12px">
          Recupera tu contraseña
        </mj-text>
        <mj-text>
          Hola, <strong>${safeRecipientName}</strong>:
        </mj-text>
        <mj-text>
          Recibimos una solicitud para restablecer la contraseña de tu cuenta institucional en UMSSY. Tu código de verificación es:
        </mj-text>

        <mj-section background-color="#EEF3F8" border-radius="8px" padding="16px">
          <mj-column>
            <mj-text align="center" font-size="34px" font-weight="800" letter-spacing="8px" color="#003770" padding="0">
              ${code}
            </mj-text>
          </mj-column>
        </mj-section>

        <mj-text font-size="13.5px" color="#5B6470" padding-top="16px">
          Este código vence en <strong>${expirationMinutes} minutos</strong>. Por tu seguridad, no compartas este código con ninguna otra persona.
        </mj-text>

        <mj-text font-size="13px" color="#5B6470">
          Si tú no solicitaste este cambio, puedes ignorar este mensaje; tu contraseña actual se mantendrá segura y sin cambios.
        </mj-text>

        <mj-divider border-color="#E3E7EC" border-width="1px" padding="24px 0" />
        <mj-text align="center" font-size="12px" color="#5B6470">
          UMSSY · Universidad Mayor de San Simón<br />
          Cochabamba, Bolivia
        </mj-text>
      </mj-column>
    </mj-section>
    <mj-spacer height="24px" />
  </mj-body>
</mjml>
  `.trim();

  const result = mjml2html(mjmlTemplate);
  return result.html;
}