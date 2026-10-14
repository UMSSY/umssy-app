# Despliegue para la evaluación

Repositorio: https://github.com/UMSSY/umssy-app
Rama de despliegue: `deploy/docente-2026-10-14`.

## 1. GitHub

Esta rama conserva el registro directo, las mejoras integradas de develop y el logo UMSSY de la épica 8. No contiene archivos `.env` ni una copia de los usuarios reales de tu laptop.

## 2. Render: base de datos y backend

Conecta Render a GitHub, crea un Blueprint desde este repositorio y selecciona la rama indicada. El archivo `render.yaml` configura una base PostgreSQL y un servicio web gratuitos. Revisa los recursos antes de confirmar su creación.

Para `CORS_ORIGIN`, introduce la URL del frontend de Vercel sin una barra al final. Si aún no existe, puedes usar temporalmente `https://example.invalid` y reemplazarla cuando Vercel termine el despliegue.

Render genera el secreto JWT y conecta la base de datos automáticamente. En el arranque se aplican las migraciones. Solo si la base está vacía se cargan datos y cuentas de demostración; no se vuelven a sembrar al actualizar una base con usuarios.

Guarda la URL del backend publicada por Render: se usará como `https://TU-BACKEND.onrender.com/api`. La URL real puede tener un sufijo.

## 3. Vercel: frontend

Importa el mismo repositorio. Configura:

- Root Directory: `frontend`.
- Framework: Next.js.
- Node.js: `22.x`.
- Production Branch: `deploy/docente-2026-10-14`.
- Variable `NEXT_PUBLIC_APP_ENV`: `prod`.
- Variable `NEXT_PUBLIC_API_URL_PROD`: URL real de Render seguida de `/api`.

La configuración de instalación y compilación está en `frontend/vercel.json`. Las variables públicas se incorporan durante la compilación: si cambias la URL del backend, debes volver a desplegar el frontend.

## 4. Conectar y comprobar

Actualiza `CORS_ORIGIN` en Render con la URL final de Vercel. Espera a que ambos despliegues terminen y comprueba:

1. `/login` carga sin seleccionar un rol.
2. La cuenta de demostración `prueba@umss.edu.bo` / `Prueba123` inicia sesión.
3. Crear cuenta funciona y una cuenta nueva puede iniciar sesión.
4. Perfil, oportunidades y demás módulos cargan según los roles disponibles.

Comparte con el docente la URL de Vercel y la cuenta de demostración. Las cuentas de la laptop no se trasladan automáticamente a esta base online.

## Actualizaciones

Integra y verifica los cambios de tus compañeros en esta rama; al hacer push, los servicios configurados para ella pueden volver a desplegarse. Las migraciones pendientes se aplican durante el arranque del backend; no uses `migrate reset` en la base online.

## Límites del plan gratuito

El backend gratuito de Render puede tardar en responder tras inactividad y la base gratuita tiene vencimiento. Comprueba su vigencia antes de la evaluación. Este archivo no autoriza contratar planes pagos.

Referencias: https://render.com/docs/blueprint-spec · https://render.com/docs/free · https://vercel.com/docs/monorepos
