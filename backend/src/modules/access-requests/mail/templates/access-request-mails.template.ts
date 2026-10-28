// Contenido de cada correo en MJML. Los {{ valores }} los reemplaza MailTemplateService
// y el marco (logo, cabecera y pie) lo pone layout.mjml.

export const ACTIVATION_CODE_MJML = `
<mj-section padding="8px 24px">
  <mj-column>
    <mj-text mj-class="heading">Activa tu cuenta</mj-text>
    <mj-text>Tu solicitud de acceso fue aprobada. Ingresa este código para activar tu cuenta:</mj-text>
    <mj-text align="center" font-family="Inter Tight, Inter, Arial, sans-serif" font-size="38px" line-height="44px" font-weight="800" letter-spacing="10px" color="#003770" padding="8px 0 16px">{{ code }}</mj-text>
    <mj-text mj-class="secondary">El código vence en {{ expiresInMinutes }} minutos. Si no solicitaste el acceso, ignora este correo.</mj-text>
    <mj-button href="{{ activationUrl }}">Activar mi cuenta</mj-button>
  </mj-column>
</mj-section>`;

export const ACCOUNT_ACTIVATED_MJML = `
<mj-section padding="8px 24px">
  <mj-column>
    <mj-text mj-class="heading">Tu cuenta está activa</mj-text>
    <mj-text>Hola {{ firstName }}, tu cuenta fue activada y ya formas parte de la comunidad. Inicia sesión con tu correo y la contraseña que creaste.</mj-text>
    <mj-button href="{{ loginUrl }}">Iniciar sesión</mj-button>
    <mj-text mj-class="secondary">Si no fuiste tú, comunícate con la carrera lo antes posible.</mj-text>
  </mj-column>
</mj-section>`;

export const REJECTION_MJML = `
<mj-section padding="8px 24px">
  <mj-column>
    <mj-text mj-class="heading">Tu solicitud no fue aprobada</mj-text>
    <mj-text>Revisamos tu solicitud de acceso y no pudimos aprobarla por el siguiente motivo:</mj-text>
    <mj-text mj-class="secondary">{{ reason }}</mj-text>
    <mj-text>Puedes corregir lo indicado y enviar una nueva solicitud.</mj-text>
    <mj-button href="{{ requestAccessUrl }}">Solicitar acceso</mj-button>
  </mj-column>
</mj-section>`;