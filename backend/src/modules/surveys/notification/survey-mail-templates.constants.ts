export const SURVEY_REMINDER_MAIL_TEMPLATE = `<mj-section padding="8px 24px">
  <mj-column>
    <mj-text mj-class="heading">Recordatorio de encuesta</mj-text>
    <mj-text>Hola {{ recipientName }}, aún no respondiste la encuesta <strong>«{{ surveyTitle }}»</strong>.</mj-text>
    <mj-text>Tu respuesta nos ayuda a obtener resultados más representativos sobre la empleabilidad de los titulados.</mj-text>
    <mj-text mj-class="secondary">Cierra el: {{ closesAtFormatted }}</mj-text>
    <mj-button href="{{ actionUrl }}">Responder encuesta</mj-button>
  </mj-column>
</mj-section>
`;

export const SURVEY_CLOSING_SOON_MAIL_TEMPLATE = `<mj-section padding="8px 24px">
  <mj-column>
    <mj-text mj-class="heading">Cierre próximo de encuesta</mj-text>
    <mj-text>Hola {{ recipientName }}, este es un aviso sobre una encuesta que creaste.</mj-text>
    <mj-text>La encuesta <strong>«{{ surveyTitle }}»</strong> está próxima a cerrar.</mj-text>
    <mj-text mj-class="secondary">Cierra el: {{ closesAtFormatted }}</mj-text>
    <mj-text mj-class="secondary">Respuestas hasta ahora: {{ responsesCount }}</mj-text>
    <mj-text mj-class="secondary">Estado: Publicada</mj-text>
    <mj-button href="{{ actionUrl }}">Ver analíticas</mj-button>
  </mj-column>
</mj-section>
`;

export const SURVEY_CLOSED_MAIL_TEMPLATE = `<mj-section padding="8px 24px">
  <mj-column>
    <mj-text mj-class="heading">Encuesta cerrada</mj-text>
    <mj-text>Hola {{ recipientName }}, este es un aviso sobre una encuesta que creaste.</mj-text>
    <mj-text>El periodo de recepción de respuestas para la encuesta <strong>«{{ surveyTitle }}»</strong> ha concluido.</mj-text>
    <mj-text mj-class="secondary">Cerró el: {{ closesAtFormatted }}</mj-text>
    <mj-text mj-class="secondary">Respuestas recibidas: {{ responsesCount }} en total</mj-text>
    <mj-text mj-class="secondary">Estado: Cerrada</mj-text>
    <mj-button href="{{ actionUrl }}">Ver resultados</mj-button>
  </mj-column>
</mj-section>
`;

export const SURVEY_VARIATION_ALERT_MAIL_TEMPLATE = `<mj-section padding="8px 24px">
  <mj-column>
    <mj-text mj-class="heading">Alerta de variación significativa</mj-text>
    <mj-text>Hola {{ recipientName }}, detectamos cambios significativos en los resultados de la encuesta <strong>«{{ surveyTitle }}»</strong> frente al semestre anterior (umbral: {{ threshold }} pp).</mj-text>
    <mj-text font-weight="700" color="#003770" padding="12px 0 4px">Resumen de variaciones detectadas</mj-text>
    <mj-text padding="0 0 16px"><div style="white-space: pre-wrap; font-family: monospace, sans-serif; font-size: 13px;">{{ shiftsContent }}</div></mj-text>
    <mj-button href="{{ actionUrl }}">Ver analíticas</mj-button>
  </mj-column>
</mj-section>
`;
