## Investigacion #912: Estandares de Tailwind CSS

Fuentes: https://tailwindcss.com/docs/functions-and-directives, https://github.com/francoismassart/eslint-plugin-tailwindcss/releases/tag/v4.0.3

### 1. Estado actual del repo (develop)

- Tailwind `^4.3.3` con `@tailwindcss/postcss`. No existe `tailwind.config`; `components.json` tiene `tailwind.config` vacio. El proyecto ya trabaja en modo CSS-first.
- Un solo archivo de entrada: `frontend/src/app/globals.css` con `@import "tailwindcss"`, `tw-animate-css` y `shadcn/tailwind.css`.
- Los tokens estan en `@theme inline` (colores `ink`, `accent`, `danger`, `gold`, `surface`, escala de texto y radios).
- ESLint no tiene ninguna regla de Tailwind hoy.

Hallazgos a corregir:

- Colores hex escritos a mano en TSX (`bg-[#F6F7F9]`, `text-[#0B1F2E]`, `border-[#E3E7EC]`) en `chat`, `home` y `mentors`. Varios no pertenecen a la paleta oficial: `#0B2545`, `#13294B`, `#DC2626`, `#FEE2E2`, `#F3F4F6`.
- Clases de la paleta por defecto de Tailwind (`bg-slate-100`, `bg-blue-50`) mezcladas con la paleta del equipo.
- Los tests comprueban clases con hex (`toContain("bg-[#FEE2E2]")`), asi que al migrar a tokens hay que actualizar tambien esos tests.
- Tokens duplicados: `--accent` en `:root` es `#FDECED`, pero `--color-accent` en `@theme` es `#E30613`, y `bg-accent` usa el segundo. Definir un solo origen por token.
- Hay `@custom-variant dark` y `next-themes`, pero no existe bloque `.dark`.

### 2. Reglas propuestas

1. Un unico archivo de entrada CSS: `src/app/globals.css`. Dueno: DevOps (CODEOWNERS).
2. Sin `tailwind.config`. Todo token vive en `@theme`.
3. Solo clases de Tailwind en el JSX. Sin CSS por componente ni `style` en linea para estilos estaticos.
4. Prohibido hex, rgb o hsl dentro de clases (`bg-[#...]`). Usar token (`bg-ink`, `text-accent`, `border-border`). Valor arbitrario solo si no existe token y se justifica en el PR.
5. Prohibidas las clases de color por defecto (`slate-*`, `blue-*`, `gray-*`) cuando existe token equivalente.
6. Cada token de color se define una sola vez.
7. Las clases se componen con `cn(...)`. Variantes con `cva`.
8. Nombres de clase completos, nunca armados por concatenacion de strings (por confirmar en la documentacion de deteccion de clases de tailwindcss.com).

### 3. Directivas (Tailwind v4)

| Directiva | Uso en el proyecto |
|---|---|
| `@import` | Permitida. Orden: `tailwindcss`, `tw-animate-css`, `shadcn/tailwind.css`. |
| `@theme` / `@theme inline` | Permitida. Unico lugar para tokens. |
| `@custom-variant` | Permitida (modo oscuro). |
| `@utility` | Permitida para utilidades repetidas que funcionen con variantes (`hover:`, `lg:`). |
| `@variant` | Permitida solo en CSS global. |
| `@source` | Solo si Tailwind no detecta una ruta (por ejemplo una libreria en `node_modules`). |
| `@apply` | Solo dentro de `@layer base` en `globals.css`. Prohibida en componentes. |
| `@config`, `@plugin`, `theme()` | Prohibidas: la documentacion oficial indica que existen solo por compatibilidad con v3. |

### 4. Importaciones

- `globals.css` se importa una sola vez, desde el layout raiz. Ningun otro archivo importa CSS global.
- Archivos CSS nuevos fuera de `globals.css` requieren aprobacion de DevOps.

### 5. Automatizacion

- `eslint-plugin-tailwindcss` v3 no esta pensado para Tailwind v4. La version 4 del plugin esta reescrita, solo es compatible con Tailwind v4 y ESLint flat config, y requiere `cssConfigPath` apuntando al CSS (`src/app/globals.css`).
- Pendiente: confirmar que version instala el PR #846. Si es la 3.x, es probable que ese sea el motivo del fallo de CI Frontend.
- Alternativa oficial solo para ordenar clases: `prettier-plugin-tailwindcss`.
- Para prohibir hex en clases se puede usar `no-restricted-syntax` con un selector sobre literales que coincidan con `\[#`, igual que ya se hace con los emojis (Standard 2.1).
- Adopcion gradual: primero `warn`, y pasar a `error` cuando los modulos con hex esten migrados.

### 6. Preguntas abiertas

- Formato de entrega final (documento en el repo, README o solo este comentario) y si debe quedar tambien como regla de ESLint.
- Si habra modo oscuro; de eso depende el bloque `.dark`.
- Cual es el color de acento real: `#E30613` (tema) o `#FDECED` (variable `--accent`).
