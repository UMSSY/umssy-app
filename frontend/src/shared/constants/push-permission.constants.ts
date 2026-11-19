import type { PushGuideKind } from "@/shared/types/push-guide-kind.types";

export const PUSH_PERMISSION_PROMPT = {
  title: "Activar notificaciones en el celular",
  description:
    "UMSSY te avisará en tu celular de mensajes, citas, encuestas y otros avisos importantes, aunque la app esté cerrada. Al continuar, tu celular te pedirá permiso para mostrar notificaciones.",
  dismiss: "Ahora no",
  confirm: "Continuar",
} as const;

export const PUSH_GUIDES: Record<
  PushGuideKind,
  { title: string; description: string; steps: readonly string[] }
> = {
  blocked: {
    title: "Las notificaciones están bloqueadas",
    description:
      "Tu celular tiene bloqueadas las notificaciones de UMSSY. Para recibirlas, habilítalas así:",
    steps: [
      "Abre los Ajustes de tu celular.",
      "Entra en Aplicaciones (en iPhone: Notificaciones) y busca UMSSY.",
      "Activa «Permitir notificaciones».",
      "Vuelve a UMSSY y elige otra vez «En el celular (Push)».",
    ],
  },
  "ios-old": {
    title: "Actualiza tu iPhone",
    description:
      "Tu versión de iOS no permite recibir notificaciones de UMSSY. Se necesita iOS 16.4 o superior.",
    steps: [
      "Abre Ajustes > General > Actualización de software.",
      "Instala iOS 16.4 o una versión más reciente.",
      "Mientras tanto, puedes elegir «Solo por correo» o «Solo dentro de la app».",
    ],
  },
  "ios-not-installed": {
    title: "Instala UMSSY en tu pantalla de inicio",
    description:
      "En iPhone, las notificaciones solo funcionan si UMSSY está instalada en la pantalla de inicio.",
    steps: [
      "Abre UMSSY en Safari.",
      "Toca el botón Compartir (el cuadrado con la flecha hacia arriba).",
      "Elige «Agregar a pantalla de inicio» y confirma.",
      "Abre UMSSY desde el nuevo ícono y vuelve a elegir «En el celular (Push)».",
    ],
  },
};

export const PUSH_GUIDE_CLOSE_LABEL = "Entendido";
