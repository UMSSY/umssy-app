# Project Standards

## 1. FRONTEND ARCHITECTURE AND STANDARDS

### 1.1 Technology Stack

- **Core:** Next.js 16 (App Router), React 19.2.
- **Styles and UI:** Tailwind CSS, shadcn/ui. Only Lucide Icons are allowed.
- **Server state:** TanStack Query (React Query) v5.
- **Global session/UI state:** React Context (`AuthContext`) for sessions.
- **Local persistence:** `idb` (an IndexedDB wrapper) for business data and the synchronization queue; `localStorage` only for lightweight preferences (theme, language).
- **Architecture:** Modular by domain.

#### 1.1.1 Colors

**Fundamental rule:** Every color must serve an informational or brand purpose. Colors are not used purely for aesthetics, except for a strictly ornamental gold stroke (`#C9A227`) on headings.

**Main palette:** Anchored in the UMSS identity, it uses “UMSS Red” for accents, primary buttons, and active indicators. Text uses dark “Ink” tones (`#0B1F2E` and `#33465A`), supported by neutral backgrounds (white and soft grays).

**Alerts and interactions:** To avoid competing with the brand red, “Dark Red” is reserved strictly for critical or negative alerts. “Soft Red” is limited to indicating selection or interaction in forms.

**No traffic-light pattern:** Green, amber, and red backgrounds must not be used for statuses. Labels use plain text to avoid visual overload and semantic confusion with the brand.

#### 1.1.2 Styles

**Visual concept:** An institutional, trustworthy design that avoids feeling bureaucratic, prioritizing usability, mobile use, and clear reading of dense data.

**Minimal typography:** A lightweight system built on a single font family (Inter / Inter Tight), using only weights (400 to 800) and sizes to establish the hierarchy of titles, headings, and metadata.

**Geometry and elevation:** Cards and containers use moderate border radii (6 to 10px), avoiding overly rounded or rigid shapes, with extremely subtle, almost imperceptible shadows instead of generic shadows.

Clean components:

- **Sidebar:** Dark background with reduced-opacity white text. Active items use a red dot and a subtle background rather than solid color blocks.
- **Buttons:** Red primary buttons (used sparingly to avoid competing with alerts) and transparent secondary (ghost) buttons with light borders.
- **Tables:** Clean design without zebra striping, using only 1px divider lines and small uppercase headers (11.5px).

### 1.2 Layer and Module Responsibilities

#### 1.2.1 Routing Layer (app/)

Defines routes, layouts, and loading/error states. Does not fetch data.

**Strict rule:** A `page.tsx` must be a thin Server Component that only resolves `params`/`searchParams` (Promises in Next 16, so they must be awaited) and renders the View imported from the module. It never contains business JSX.

#### 1.2.2 Feature Module Layer (modules/)

Organized by permanent business domain (`modules/auth`, `modules/billing`, `modules/enrollment`, `modules/scanner`), retaining the same philosophy. Internal structure, with one addition:

- `views/`: The new home for full-screen components previously placed outside a dedicated folder (for example, `DashboardView`), separate from reusable module components.
- `components/`: Internal visual pieces of the module.
- `hooks/`: Domain-specific TanStack Query `useQuery`/`useMutation` hooks.
- `services/`: Domain HTTP calls.
- `types/`, `index.ts`: Same as before.

Every View and hook using React state, TanStack Query, or browser APIs (camera, IndexedDB) must explicitly declare `'use client'`.

#### 1.2.3 Shared Components Layer

- `src/components/ui/` contains shadcn/ui primitives.
- `src/shared/components/` contains shared application components, including layouts such as Navbar, Sidebar, and Shell. `AuthGate` and `RoleGate` receive role and session state through props or context and decide what to render. They never fetch data directly.

#### 1.2.4 Core Services Layer (shared/services/)

A single Axios instance (`api-client.ts`) with 401/refresh interceptors. There is no session cookie set by a backend of our own, so the token and refresh token live in IndexedDB. **Strict prohibition:** No one imports Axios or uses `fetch` directly outside this instance.

#### 1.2.5 Persistence Layer (shared/services/storage/)

Centralizes access to `localStorage` (preferences) and IndexedDB (`idb`) for business data and the TanStack Query persister. No module opens IndexedDB directly; all use this wrapper.

#### 1.2.6 Styles Layer

Only Tailwind utilities. No per-component CSS; `globals.css` is the only CSS file.

### 1.3 Directory Structure

```text
src/
├── app/                                    # Enrutamiento (App Router)
│   ├── layout.tsx                          # Root layout: <html>, <body>, <Providers>
│   ├── providers.tsx                       # "use client" — TanStack Query, AuthContext
│   ├── globals.css
│   ├── manifest.ts                         # Web App Manifest (PWA nativo, sin deps)
│   ├── sw.ts                               # Service Worker
│   ├── (public)/                           # Grupo de rutas SIN sesión
│   │   ├── layout.tsx                      # Layout minimal (branding, sin sidebar)
│   │   ├── login/
│   │   │   └── page.tsx                    # importa LoginView
│   │   └── register/
│   │       └── page.tsx
│   │
│   ├── (app)/                              # Grupo de rutas AUTENTICADAS
│   │   ├── layout.tsx                      # Server Component que renderiza AppRouteLayout
│   │   ├── loading.tsx                     # Skeleton global de la sección
│   │   ├── error.tsx                       # Error boundary del segmento
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── billing/
│   │   │   └── page.tsx
│   │   ├── enrollment/
│   │   │   └── page.tsx
│   │   └── scanner/                        # Lectura de QR, funciona offline
│   │       └── page.tsx
│   │
│   └── not-found.tsx
│
├── modules/                                # LÓGICA DE NEGOCIO por dominio
│   ├── auth/
│   │   ├── views/                          # LoginView, RegisterView
│   │   ├── components/               # Solo son TSX usa hooks o Injection de Props.
│   │   ├── hooks/                          # useLogin, useSession
│   │   ├── services/                       # auth.api.ts
│   │   ├── types/		        # suele ser los Interface que necesitan UserProps.
│   │   └── index.ts
│   ├── billing/
│   │   └── ... (misma estructura)
│   ├── enrollment/
│        └── ...
│
├── components/
│   └── ui/                                 # shadcn/ui
│
├── shared/
│   ├── components/
│   │   └── layout/                         # Navbar, Sidebar, Shell, AuthGate, RoleGate
│   ├── contexts/                           # AuthContext
│   ├── hooks/                              # useOnlineStatus, useWindowSize
│   ├── services/
│   │   ├── api-client.ts                   # Instancia Axios centralizada
│   │   ├── query-client.ts                 # Factory del QueryClient
│   │   └── storage/
│   │       ├── local-storage.ts            # Preferencias livianas
│   │       └── indexed-db.ts               # Wrapper idb
│   ├── types/
│   └── utils/
│
└── middleware.ts
```

### 1.4 Architecture Rules and Best Practices

- **Standardized error handling:** Infrastructure errors (401/403/500) are intercepted in `api-client.ts`. Business errors (400/404/422) propagate to the module and appear as Spanish toasts through TanStack Query's `onError`.
- **Strict encapsulation through `index.ts`:** Each module explicitly exports its public Views, hooks, and types. Anything not exported is private to the module.
- **No cross-domain coupling:** No module imports from another module's internal subfolders.
- **Explicit Server/Client boundary (new):** `page.tsx` and `layout.tsx` in `app/` remain thin Server Components. Anything depending on React hooks, TanStack Query, `window`, the camera, or IndexedDB belongs in a `'use client'` file inside `modules/*/views` or `modules/*/components`.
- **Service Worker scope:** Serwist caches only the app shell and static assets. It never contains business logic; that lives in `shared/services/storage` and each module's hooks.

### 1.5 Sidebar and Role-Based Access Control

- **Single source of truth:** `shared/config/route-access.config.ts` (`APP_ROUTE_ACCESS`) defines which roles can access each route. Roles are `titulado`, `estudiante`, `mentor`, `empresa`, and `administrativo`.
- The menu is defined in `shared/config/navigation.config.ts` (`SIDEBAR_NAVIGATION`). Each item gets its roles through `getRouteRoles("<route>")`, which returns the roles from the first matching `APP_ROUTE_ACCESS` rule, or an empty list if none matches.
- `AppSidebar` reads user roles through `useAuth`, and `filterNavigationByRoles` hides items the user cannot see. An empty role list hides the item from everyone. A group with children appears only if at least one child is visible.
- The same function is used in `RoleGate` (page access) and post-login redirection, keeping the menu and access rules consistent.
- To add an item: (1) add the rule to `APP_ROUTE_ACCESS`, placing more specific patterns before general ones because the first match wins; (2) add the item to `SIDEBAR_NAVIGATION` with a Lucide icon, `href`, and `roles: getRouteRoles(...)`; (3) add other routes that should keep it highlighted to `activePathPatterns`; (4) update the tests.
- **Common mistake:** Forgetting step 1 hides the item from everyone.

## 2. TAILWIND AND SHADCN STANDARDS

### 2.1 Tailwind

- **Official version:** Tailwind CSS v4.
- **Paradigm:** CSS-first configuration; `tailwind.config.js` has been removed.
- **General rule:** All design system configuration lives in the global `globals.css` file.

#### 2.1.1 Design Tokens and Theme Variables (@theme)

Declare design tokens in the `@theme` block using native variables with their corresponding prefixes:

```text
--color-*       Color utilities: bg-*, text-*, border-*
--font-*        Font families: font-*
--breakpoint-*  Media queries: 2xl:*
```

#### 2.1.2 Code Conventions (Do's and Don'ts)

**Class order:** The linter manages utility ordering automatically through `eslint-plugin-tailwindcss` (`classnames-order`), already configured in the project. Do not debate class order in PRs; ESLint fixes it with `eslint --fix`.

**Do not overuse `@apply`:**

Incorrect: Creating traditional CSS classes such as:

```css
.user-card { @apply flex p-4 rounded-lg bg-card; }
```

Correct: Encapsulate the logic in a reusable UI component.

**Conditional classes and conflict resolution:** Every component accepting external classes through `className` or dynamic props must use the `cn()` utility.

**Arbitrary values:** Avoid bracket values such as `w-[323px]` or `text-[#23a1ef]`. If a measurement or color belongs to the corporate design, add it to `@theme`. Brackets are allowed only in exceptional cases, such as precise absolute positioning for a specific animation.

#### 2.1.3 Quick Migration Table for v4

| If you would write... | In v4, write... | Reason |
| --- | --- | --- |
| `shadow-sm` | `shadow-xs` | The scale was restructured; `shadow-sm` is now larger. |
| `rounded-sm` | `rounded-xs` | The base scale starts at `-xs`. |
| `outline-none` | `outline-hidden` | `outline-none` no longer removes the accessible focus indicator. |
| `ring` | `ring-3` | Bare `ring` no longer assumes 3px by default. |
| `text-{color}-500` | Explicit mapping | Tailwind's scanner does not detect dynamic strings. |

### 2.2 SHADCN

There is no `@shadcn/ui` package to import from `node_modules`.

The team owns the code. Components are downloaded using the CLI and copied into the project's own directory (`src/components/ui/`):

```bash
pnpm dlx shadcn@latest add <component>
```

Components can and should be modified. If a button needs a new variant, edit `components/ui/button.tsx` directly. Do not create unnecessary wrappers around base components.

#### 2.2.1 Team Standardization Rules

**Surface / Foreground pairing:** Every surface token has a required text counterpart. Never combine a semantic surface with a hardcoded color:

```text
Correct: bg-primary text-primary-foreground
Prohibited: bg-primary text-white
```

The prohibited combination makes text unreadable in dark mode or custom themes.

#### 2.2.2 Component Addition Workflow

Install base components only through the CLI:

```bash
pnpm dlx shadcn@latest add button card dialog
```

Commit them under `components/ui/` like any manually created file.

**Be careful with `--overwrite`:** If someone customized a component in `components/ui/`, running the following command deletes the team's changes:

```bash
pnpm dlx shadcn@latest add button -y --overwrite
```

**`cva` rule:** Place it in the component when it is exclusive to that component; place it in a separate file when multiple files will reuse it.

#### 2.2.3 The size-* Convention in v4

Tailwind v4 and new shadcn components replace `w-4 h-4` with `size-4`:

- Use `size-4`, `size-5`, especially for SVG icons such as Lucide.
- Avoid `w-4 h-4`.

#### 2.2.4 Modifications Through cn() and Props

Any component instance requiring margins or external layout adjustments must receive them through `className`:

```tsx
<Button className="w-full mt-4" variant="outline"> Continuar </Button>
```

#### 2.2.5 Critical Mistakes Made by New Teams

| Common mistake | Why it happens | Consequence and solution |
| --- | --- | --- |
| Installing `tailwindcss-animate` | Following old v3 tutorials. | This JS plugin is obsolete in Tailwind v4 and causes compilation errors. shadcn uses `tw-animate-css` in v4. |
| Misconfigured path aliases | `components.json` assumes `@/*`, but `tsconfig.json` does not configure `"paths": { "@/*": ["./src/*"] }`. | The CLI installs components, but TypeScript reports import errors (`Cannot find module '@/lib/utils'`). |
| Creating copies instead of variants | A developer needs a gradient button and creates `components/GradientButton.tsx` from scratch. | Base UI accessibility is lost. Open `components/ui/button.tsx` and add a variant to `buttonVariants` using `cva`. |
| Forgetting `data-slot` attributes | In v4, shadcn uses selectors such as `data-slot="icon"` or `data-slot="input"` to style child elements automatically. | Removing `data-slot` while rewriting internal JSX breaks automatic focus, spacing, and icon styles. |
| Confusing Server and Client Components | In Next.js, components using Base UI hooks (Dialog, Dropdown, Accordion) require interactivity. | Using them directly in Server Components without wrapping them or understanding the render tree causes hydration errors or a request for `"use client"`. |

### 2.3 Project Tailwind Rules

- One CSS entry file: `src/app/globals.css`, imported exactly once from the root layout. Creating another CSS file requires DevOps approval.
- There is no `tailwind.config`. Every token lives in `@theme`, and each color token is defined exactly once.
- Only Tailwind classes in JSX: no per-component CSS or inline `style` for static styles.
- Do not write hex, rgb, or hsl values inside classes (`bg-[#0B1F2E]`). Use tokens (`bg-ink`, `text-accent`). An arbitrary value is allowed only when no token exists and the PR justifies it.
- Default palette classes (`slate-*`, `blue-*`, `gray-*`) are prohibited when an equivalent token exists.
- Write complete class names; never construct them by concatenating strings.
- Allowed directives: `@import` (in order: `tailwindcss`, `tw-animate-css`, `shadcn/tailwind.css`), `@theme` and `@theme inline`, `@custom-variant`, `@utility`, `@variant` (only in global CSS), and `@source` (only if Tailwind does not detect a path). `@apply` is allowed only inside `@layer base` in `globals.css`. Prohibited: `@config`, `@plugin`, and `theme()`.
- Automatic ESLint checks: class order, size shortcuts, and nonexistent classes. The remaining rules in this list are checked during PR review.

### 2.4 shadcn and Base UI Rules

- The project uses Base UI. Installing or importing `radix-ui` or `@radix-ui/*` is prohibited. Do not use `asChild`; use the `render` prop to render another element.
- Only `src/components/ui/**` may import `@base-ui/react`. All other code imports from `@/components/ui/<component>`.
- Add components only with `pnpm dlx shadcn@latest add <component>`, never by copying code from the internet.
- Editing files in `components/ui` for design adjustments is allowed, but the PR must identify those edits because rerunning `shadcn add` overwrites them.
- Business logic does not belong in `components/ui`: this layer must not import services or data libraries.
- Allowed native HTML: `div`, `section`, `main`, `nav`, `header`, `footer`, `aside`, `article`, `ul`, `ol`, `li`, `p`, `span`, `h1` through `h6`, `form` (composed with Field), anchors through `next/link`, images through `next/image`, and Lucide SVGs.
- Native HTML is prohibited when a component exists: `button` (Button), `input` (Input), `textarea` (Textarea), `select` (Select or NativeSelect), `label` (Label), checkbox and radio (Checkbox, RadioGroup), `table` (Table), `dialog` (Dialog or AlertDialog), and `progress` (Progress). Outside `src/components/ui/`, ESLint reports native `button`, `input`, and `select` as errors. Native inputs with an explicit literal `type` of `file` or `hidden` are allowed when there is no equivalent component and the PR explains the exception.