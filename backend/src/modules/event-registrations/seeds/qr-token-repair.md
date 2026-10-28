# Reparar tokens QR de datos precargados

Las inscripciones antiguas de los seeds pueden contener tokens `qr-seed-...` o
`seed-...`, incompatibles con el contrato de los pases (64 caracteres hexadecimales).

Desde `backend`, con las variables de conexión de la base afectada:

```sh
pnpm exec tsx src/modules/event-registrations/seeds/repair-seeded-qr-tokens.ts
```

El comando muestra la cantidad de tokens reparados. No carga usuarios ni talleres,
no elimina inscripciones y conserva los tokens válidos. Se puede repetir: una
segunda ejecución sin nuevos datos antiguos debe informar cero reparaciones.
Después, recargar Mis inscripciones o pulsar Reintentar.

Ambos seeds de inscripciones también ejecutan esta reparación cuando se vuelven
a cargar. Para reparar una base existente se recomienda el comando específico,
que evita ejecutar el resto de los seeds.
