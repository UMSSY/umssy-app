## Investigacion #913: shadcn/ui, Base UI y Radix UI

Fuentes: https://ui.shadcn.com/docs/changelog/2026-07-base-ui-default, https://ui.shadcn.com/docs/changelog. Pendiente de contrastar directamente con base-ui.com y radix-ui.com.

### 1. Que es shadcn/ui y para que sirve

- No es una libreria instalada como dependencia de componentes: el CLI copia el codigo de cada componente a `src/components/ui`, y desde ese momento el codigo es del proyecto.
- Cada componente combina una libreria de primitivos accesibles (Base UI o Radix), estilos con Tailwind y variantes con `cva`.
- El valor `style` de `components.json` define libreria y estilo con el formato `{libreria}-{estilo}`. En el proyecto: `base-nova` (Base UI con estilo Nova).

### 2. Estado actual del repo

- `@base-ui/react ^1.8.0`, `shadcn ^4.21.0`, `class-variance-authority`, `tw-animate-css`, iconos `lucide`.
- 40 archivos en `src/components/ui` (button, card, dialog, select, native-select, sidebar, table, tabs, sheet, entre otros).
- Ningun archivo fuera de `components/ui` importa `@base-ui/react`, `@radix-ui` ni usa `asChild`. La capa de primitivos ya esta aislada.
- `src/lib/utils.ts` hace `export { cn } from "cn"` usando el paquete npm `cn`. Los componentes de shadcn esperan normalmente `cn` hecho con `clsx` y `tailwind-merge`. Revisar que `cn("p-2", "p-4")` devuelva solo `p-4`; si no resuelve conflictos, los `className` que se pasan a los componentes no sobreescribiran bien los estilos base.
- Mas de 70 archivos en `src/modules` y `src/shared` usan `<button>`, `<input>`, `<select>`, `<textarea>`, `<label>` o `<table>` nativos en lugar de los componentes de `components/ui`.

### 3. Base UI vs Radix UI

Cambio reciente: desde julio de 2026, Base UI es la libreria por defecto de shadcn/ui en proyectos nuevos (`shadcn init`), y las paginas de documentacion abren en la pestana de Base UI. Radix sigue soportado (`shadcn init -b radix`). shadcn recomienda Base UI para proyectos nuevos.

| Aspecto | Radix UI | Base UI |
|---|---|---|
| Paquete | `radix-ui` / `@radix-ui/*` | `@base-ui/react` (un solo paquete, imports por subruta) |
| Composicion (renderizar otro elemento) | prop `asChild` | prop `render` |
| Atributos de estado | `data-state` | atributos de datos propios de Base UI |
| Mantenimiento | Comunidad Radix | Equipo de MUI |

Como funciona con shadcn: el CLI elige los componentes segun el prefijo del estilo (`base-` o `radix-`). Al instalar con el CLI, `asChild` se convierte a `render`; si se copia codigo a mano hay que convertirlo manualmente.

### 4. Reglas propuestas

1. El proyecto usa solo Base UI. Prohibido instalar o importar `radix-ui` y `@radix-ui/*`. Prohibido `asChild`; se usa `render`.
2. Solo `src/components/ui/**` puede importar `@base-ui/react`. El resto importa desde `@/components/ui/<componente>`.
3. Los componentes se agregan solo con `pnpm dlx shadcn@latest add <componente>`, no copiando codigo de internet.
4. Editar un archivo de `components/ui` esta permitido para ajustes de diseno, pero el PR debe indicarlo, porque volver a ejecutar `shadcn add` lo sobrescribe.
5. Los estilos de los componentes usan tokens de `globals.css` (ver #912), nunca hex.
6. No mezclar Radix y Base UI en el mismo proyecto.
7. La logica de negocio no entra a `components/ui`; la capa visual no importa servicios ni librerias de datos.

### 5. Cuando se permite HTML puro

Permitido (no existe componente shadcn equivalente): `div`, `section`, `main`, `nav`, `header`, `footer`, `aside`, `article`, `ul`, `ol`, `li`, `p`, `span`, `h1` a `h6`, `form` (si se compone con `Field`), `a` mediante `next/link`, imagenes mediante `next/image`, `svg` de Lucide.

Prohibido cuando existe componente (usar el de `components/ui`): `button` (Button), `input` (Input), `textarea` (Textarea), `select` (Select o NativeSelect), `label` (Label), `checkbox` y `radio` (Checkbox, RadioGroup), `table` (Table), `dialog` (Dialog o AlertDialog), `progress` (Progress).

Excepciones: cualquier archivo dentro de `components/ui`, y `<input type="file">` o `<input type="hidden">` si no hay equivalente, justificado en el PR.

### 6. Aplicacion gradual

- Como hay mas de 70 archivos que incumplen la regla de HTML puro, activarla primero como `warn` y migrar por modulo (access-request, availability, certifications, chat, documents, education, events, mentors, mentorship, profile, reports, request-review, skills, work-experience, auth, home, shared).
- La regla de importaciones (`no-restricted-imports` para `@base-ui/react`, `@radix-ui/*` y `radix-ui` con excepcion en `src/components/ui/**`) puede ir directo como `error`, porque hoy no hay incumplimientos.
- La regla de HTML puro se implementa con `no-restricted-syntax` sobre `JSXOpeningElement`, con override que la desactive en `src/components/ui/**`.
- Relacion con el PR #846 de Nicole: ya intenta restringir HTML nativo y bloquear Radix. Debe bloquear tambien `@base-ui/react` fuera de `components/ui`, que es la libreria realmente usada.

### 7. Preguntas abiertas

- Si se acepta el paquete `cn` actual o se cambia a `clsx` + `tailwind-merge`.
- Lista final de elementos nativos prohibidos y excepciones.
- Plazo de migracion de los modulos existentes y quien lo asume.
