export const PASSWORD_RESET_EMAIL_MJML = `
<mj-section background-color="#FFFFFF" padding="24px 0">
  <mj-column>
    <mj-text font-size="20px" font-weight="700" color="#0B1F2E" padding-bottom="12px">
      Recupera tu contraseña
    </mj-text>
    <mj-text>
      Hola, <strong>{{recipientName}}</strong>:
    </mj-text>
    <mj-text>
      Recibimos una solicitud para restablecer la contraseña de tu cuenta institucional en UMSSY. Tu código de verificación es:
    </mj-text>

    <mj-text align="center" font-size="34px" font-weight="800" letter-spacing="8px" color="#003770" padding="16px" container-background-color="#EEF3F8">
      {{code}}
    </mj-text>

    <mj-text font-size="13.5px" color="#5B6470" padding-top="16px">
      Este código vence en <strong>{{expirationMinutes}} minutos</strong>. Por tu seguridad, no compartas este código con ninguna otra persona.
    </mj-text>

    <mj-text font-size="13px" color="#5B6470">
      Si tú no solicitaste este cambio, puedes ignorar este mensaje; tu contraseña actual se mantendrá Segura y sin cambios.
    </mj-text>
  </mj-column>
</mj-section>
`.trim();
