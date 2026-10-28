# HU4 — contrato implementado

`POST /api/event-proposals`, autenticado y restringido a titulados activos.
Multipart con Idempotency-Key (UUID) y title (1–80), description (1–300),
categoryId (UUID existente), eventDate (YYYY-MM-DD), startTime/endTime (HH:mm),
capacity (entero positivo), modality (presencial/virtual), location (hasta 2000
caracteres; URL HTTP(S) sin credenciales cuando es virtual) y cover (JPEG/PNG,
hasta 5 MiB, validado por contenido en servidor).

El servidor obtiene autor y tutor de la sesión. Guarda evento y portada en una
transacción, con estado En votación, umbral max(8, ceil(capacity/2)) y plazo de
10 días desde el envío. La migración 20261023000000_workshop_proposals agrega
portada, clave y huella de idempotencia, y asegura las siete categorías.

Respuesta 201: data contiene id, status: voting, supportThreshold,
votingDeadline (ISO) y coverUrl: /events/<id>/cover, relativa a la base de la API.
GET /api/events/:id/cover sirve la portada de eventos publicados o en votación.
La misma clave y autor con contenido idéntico devuelve el mismo registro;
contenido distinto devuelve 409. PostgreSQL garantiza la unicidad del envío.
Los errores por campo usan errors: { campo: mensaje }.

## Explorar y HU5

Explorar talleres consulta GET /api/events?includeProposals=true. La consulta
pública sin ese parámetro conserva únicamente los talleres publicados. Lista y
detalle incorporan status, coverUrl, supportThreshold y votingDeadline.
Al confirmar, el frontend invalida las consultas events y event-proposals y
navega a /events?proposal=<id>. Muestra el detalle y la tarjeta creada incluso
si queda fuera de la primera página. No se presenta éxito sin confirmación real.

HU5 debe implementar votos y resolución al cumplir umbral/plazo. Esta tarea
crea y muestra propuestas; no simula votos ni habilita inscripciones.

## Borrador

IndexedDB guarda campos, archivo y clave de reintento por usuario en este
navegador. Se recupera al cambiar de sección o recargar y se elimina tras la
confirmación del servidor. No equivale a publicar ni sincroniza dispositivos.
Si falla el almacenamiento, se avisa y se permite continuar editando.

## Decisiones pendientes

Se admiten talleres de un solo día, con fin posterior al inicio. Falta acordar
soporte de medianoche, cupo mínimo frente al umbral de ocho y fecha del taller
respecto a los diez días de votación. No se impusieron restricciones no acordadas.
