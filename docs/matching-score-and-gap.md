# Afinidad y requisitos faltantes — HU-03 y HU-04

Implementación de referencia de la épica 5. La guía de Git del equipo exige PR hacia la épica, validación de calidad y revisión externa antes de integrar; este documento no constituye una aprobación del PO ni sustituye las revisiones.

## Fórmula y parámetros (T3.5, AC-03.2)

Por cada categoría solicitada se calcula `peso × requisitos cumplidos / requisitos solicitados`. El porcentaje es `100 × suma de aportes / suma de pesos participantes`, redondeado al entero más cercano y acotado entre 0 y 100. Las categorías sin requisitos no participan en el denominador. Se escala internamente la magnitud de los pesos para evitar desbordamiento sin cambiar sus proporciones.

| Categoría | Valor inicial | Variable del backend |
|---|---:|---|
| Habilidades | 60 | `MATCH_SCORE_WEIGHT_SKILLS` |
| Formación académica | 25 | `MATCH_SCORE_WEIGHT_ACADEMIC` |
| Experiencia | 10 | `MATCH_SCORE_WEIGHT_EXPERIENCE` |
| Otros requisitos | 5 | `MATCH_SCORE_WEIGHT_OTHER` |

Son pesos relativos configurables, no porcentajes fijos de contratación. El servicio los lee al iniciarse y admite también pesos por llamada. Se aceptan números finitos no negativos; una configuración inválida se rechaza. Reiniciar el backend tras cambiar sus variables. Los valores iniciales requieren aprobación del PO/docente; hasta obtenerla, T3.5 conserva ese pendiente de aceptación.

Casos de referencia: todos los requisitos cumplidos → 100%; ninguno cumplido → 0%; oferta sin requisitos → 100%; una de dos habilidades cumplidas cuando sólo se piden habilidades → 50%; habilidades cumplidas y carrera pendiente, con pesos 60 y 25 → 71%. Cuando los pesos de todas las categorías solicitadas son cero, se tratan como requisitos sin ponderación y el resultado es 100%.

## Requisitos y coherencia (AC-03.4, AC-04.1–04.8)

Feed y detalle utilizan las habilidades explícitas de la vacante y las reconocidas en su descripción por el servicio NLP. La comparación normaliza mayúsculas y tildes y no cuenta habilidades duplicadas. El perfil autenticado aporta sus habilidades, formación y experiencia; el porcentaje se recalcula al consultar después de modificar el perfil.

La interfaz muestra todos los requisitos recibidos: habilidades, académicos y experiencia, y otros requisitos. `Cumple` se presenta como «Coincide» y `Pendiente` como «Falta», con iconos y texto. Una carrera o experiencia pendiente sigue visible e impide mostrar el mensaje de brecha cero.

Sólo si todos los requisitos están cumplidos, o no se solicita ninguno, se muestra «Para esta oportunidad no tienes habilidades ni requisitos pendientes». El detalle muestra el entero con `%`, la etiqueta «de afinidad con tu perfil» y una barra proporcional. «Volver» regresa a `/vacancies/recommended`.

Los documentos de «Otros requisitos» permanecen pendientes mientras no exista constancia de entrega formal por el flujo correspondiente. Subir un archivo genérico al perfil no equivale por sí solo a presentar un documento para una oferta. La fórmula no certifica la formación ni la autenticidad de documentos.

## Verificación de QA y del despliegue

1. Ingresar al entorno de la épica con una cuenta de prueba de titulado o estudiante de la guía.
2. Abrir `/vacancies/recommended`, anotar el porcentaje de una oferta y abrir su detalle. Con el mismo perfil y oferta, ambos valores deben coincidir, incluso si hay habilidades reconocibles sólo en la descripción.
3. Usar una oferta con carrera o experiencia no cumplida: el detalle debe mostrarla con «Falta» y no debe mostrar brecha cero.
4. Probar una oferta sin requisitos y otra completamente cumplida: comprobar 100%, barra proporcional y el texto aprobado de brecha cero.
5. Agregar o quitar una habilidad del perfil y volver al detalle: comprobar el nuevo porcentaje y los estados actualizados, sin duplicar etiquetas.
6. Pulsar «Volver» y comprobar la ruta del feed. Revisar las mismas operaciones en móvil y escritorio.

Las pruebas unitarias y de componentes cubren la comparación, el score, los extremos y la actualización de estados. El test de regresión de feed/detalle utiliza el NLP y el cálculo reales con repositorios controlados.

El destino existente es `https://epic5-umssy.zer4c.dev`, con API `https://epic5-api-umssy.zer4c.dev/api`. El PR debe integrarse en `epic/grupo-5-matching-y-postulaciones`; ese push activa el despliegue existente. Un PR abierto no cambia el sitio publicado. Frontend y backend tienen imágenes y actualizaciones separadas y necesarias.

No se requieren nuevas tablas ni migraciones para esta corrección. Se conserva el PR existente y no se duplican controladores, rutas ni workflows. Las aprobaciones externas requeridas por el equipo y GitHub deben constar antes de integrar; no se sustituyen por los resultados de CI.
