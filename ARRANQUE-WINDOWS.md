# Arrancar UMSSY en Windows

Con Node.js y las dependencias de frontend y backend instaladas, haz doble clic en `Iniciar UMSSY.cmd` desde esta carpeta.

El gestor abre dos terminales, inicia el backend en el puerto 8080 y el frontend en el 3001, espera una respuesta HTTP de ambos y abre `http://localhost:3001/login`.

El backend necesita su archivo `.env` con la conexión a la base de datos y `JWT_SECRET`. El gestor configura para la ejecución local `PORT=8080`, `CORS_ORIGIN=http://localhost:3001`, `JWT_EXPIRES_IN=8h` y `JWT_ALGORITHM=HS256`.

Si algún puerto ya está ocupado, no inicia otra instancia en ese puerto. Si no responden ambos servicios en 90 segundos, muestra un error; revisa sus terminales.

Para detener los servicios, pulsa `Ctrl+C` en cada terminal. Los archivos `.env` y el acceso directo `.lnk` de tu computadora no se incluyen en Git.
