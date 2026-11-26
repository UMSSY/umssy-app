import type { PushGuideKind } from "@/shared/types/push-guide-kind.types";

export const PUSH_PERMISSION_PROMPT = {
  title: "Activar avisos en este celular",
  description:
    "UMSSY te enviará un aviso cuando recibas un mensaje y no tengas UMSSY abierta. En el siguiente paso, tu navegador te pedirá permiso. Elige «Permitir». Si eliges «Ahora no», seguirás viendo tus avisos en la campana de la app.",
  dismiss: "Ahora no",
  confirm: "Continuar",
} as const;

export const PUSH_GUIDES: Record<
  PushGuideKind,
  { title: string; description: string; steps: readonly string[] }
> = {
  blocked: {
    title: "Las notificaciones de UMSSY están bloqueadas",
    description:
      "Para recibir avisos en tu celular, permítelas desde el navegador (pasos para Chrome en Android):",
    steps: [
      "Toca el icono que está a la izquierda de la dirección web.",
      "Entra a «Permisos» y activa «Notificaciones».",
      "Vuelve a esta página y elige «En el celular (Push)».",
    ],
  },
  "ios-old": {
    title: "Tu iPhone aún no permite estos avisos",
    description:
      "Para recibirlos en el celular necesitas iOS 16.4 o superior. Mientras tanto, puedes recibir tus avisos por correo y verlos en la campana de la app.",
    steps: [
      "Abre Ajustes > General > Actualización de software.",
      "Instala iOS 16.4 o una versión más reciente.",
    ],
  },
  "ios-not-installed": {
    title: "Primero agrega UMSSY a tu pantalla",
    description:
      "En el iPhone, los avisos solo llegan si UMSSY queda como un icono en tu pantalla, igual que cualquier otra app.",
    steps: [
      "Toca el botón de compartir: un cuadrado con una flecha hacia arriba.",
      "En el menú, baja y toca «Agregar a pantalla de inicio».",
      "Toca «Agregar».",
      "Abre UMSSY desde su nuevo icono y vuelve a elegir «En el celular (Push)» en Configuración del perfil.",
    ],
  },
};

export const PUSH_GUIDE_CLOSE_LABEL = "Entendido";