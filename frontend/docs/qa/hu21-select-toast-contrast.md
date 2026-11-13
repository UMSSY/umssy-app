# HU-21: contraste de listas y avisos

H21-F · Sprint 3 · CA1, CA2 y CA3. Revisión local del 12 de noviembre de 2026.

## Pruebas automatizadas

```bash
pnpm exec vitest run src/components/ui/select.test.tsx src/components/ui/sonner.test.tsx --pool=forks --maxWorkers=1
```

Resultado local: 15 pruebas aprobadas en 2 archivos, sin medición de cobertura.
La ejecución en CI queda pendiente hasta subir la rama.

- Select: navegación por teclado hasta una opción resaltada, clases de texto oscuro
  en las variantes `default` y `subtle`, selección con Enter y conservación de las
  clases de contraste. Se comprueba también la regla de descendientes de `default`.
- Toaster: avisos `success`, `error`, `info` y `warning`, con título y descripción,
  sin ThemeProvider. Se simulan preferencias de sistema clara y oscura y se comprueba
  que `data-sonner-theme` siga siendo `light`. `matchMedia` se restaura tras cada prueba.

Vitest/jsdom verifica clases y atributos, no el contraste renderizado.

## Medición en el navegador

Se renderizaron los componentes originales `Select` y `Toaster` con los estilos
originales de la aplicación en una página temporal local. Se abrió la lista y se
resaltó una opción mediante la tecla End. Los avisos de éxito y error incluyeron
texto de título y descripción, sin crear reservas ni modificar la base de datos.
La página temporal se retiró al terminar; no forma parte del producto.

Los colores se leyeron mediante `getComputedStyle` en las herramientas del navegador.
Para elementos transparentes se usó el fondo opaco del ancestro más cercano.
Se calculó la luminancia relativa sRGB y la relación `(Lmayor + 0,05) / (Lmenor + 0,05)`.
Cada canal sRGB se normalizó a 0–1: si `c <= 0,04045`, se usó `c / 12,92`;
en otro caso, `((c + 0,055) / 1,055)^2,4`. Los pesos RGB fueron 0,2126 / 0,7152 / 0,0722.

| Elemento | Texto calculado | Fondo calculado | Contraste | Mínimo |
| --- | --- | --- | --- | --- |
| Opción default resaltada y su texto hijo | #0B1F2E | #EEF3F8 | 15,05:1 | 4,5:1 |
| Opción subtle resaltada y su texto hijo | #0B1F2E | #F6F7F9 | 15,68:1 | 4,5:1 |
| Título de avisos de éxito y error | #0B1F2E | #FFFFFF | 16,80:1 | 4,5:1 |
| Descripción de avisos de éxito y error | #3F3F3F | #FFFFFF | 10,53:1 | 4,5:1 |

Los valores fueron iguales con la clase `.dark` desactivada y activada; el Toaster
mantuvo `data-sonner-theme="light"`. Esta revisión de navegador usa la clase de modo
oscuro y `color-scheme`; la preferencia del sistema operativo se simula en Vitest.

## Tamaños y límites de la revisión

- Escritorio: viewport de 1280 × 720 CSS px.
- Móvil: viewport de 360 × 800 CSS px, modo oscuro de la página activo. Los textos
  revisados de opción, título y descripción no presentaron desbordamiento horizontal
  (`scrollWidth <= clientWidth`). Se inspeccionó también la captura visual.
- Zoom nativo al 200 %: pendiente. Los atajos del navegador integrado no cambiaron
  el zoom (`devicePixelRatio=1`, viewport de 1280 px). No se acredita esa comprobación.
  Para completarla, abrir la aplicación en un navegador con control de zoom, fijar
  200 %, abrir el selector de tema y revisar un aviso con descripción.

La revisión cubre los componentes compartidos y los textos de los escenarios
anteriores; no afirma que se haya revisado cada lista o aviso del proyecto.
