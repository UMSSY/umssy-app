# JobConnect — tareas #223, #233 y #283

El módulo está registrado en `AppModule`. Estas tareas implementan servicios de backend; no incluyen las pantallas de recomendaciones ni el ranking de matching asignados a otras tareas.

## Decisiones de integración

- No se proporcionó una API externa de JobConnect. Las vacantes se consultan en PostgreSQL mediante Prisma (`vacancies`), sin ofertas ficticias ni conexiones externas.
- El diccionario inicial usa los ejemplos de HU-01 y un vocabulario técnico básico. No es un catálogo institucional oficial. Se amplía en `constants/skill-dictionary.ts`.
- UMSS, Universidad Mayor de San Simón y San Simón se reconocen como institución, separada de las habilidades. No se infiere una carrera ni un título por mencionar la universidad.
- Se preservan términos compuestos y signos significativos de C++, C#, .NET y Node.js. Se ignoran mayúsculas, acentos y espacios repetidos; se evitan coincidencias parciales y duplicados.
- El análisis recibe las aptitudes actuales del perfil en el cuerpo de la solicitud y no persiste ni certifica esas declaraciones. El consumidor debe enviar los datos actualizados. Los requisitos académicos y otros requisitos se comparan por nombre normalizado exacto, sin inferir equivalencias académicas.

## Endpoints

### `GET /api/job-connect/vacancies?page=1&limit=20`

Devuelve un array de vacantes activas que no han expirado, ordenadas por fecha de creación descendente y luego ID. `page` inicia en 1; `limit` admite 1–100. Sin vacantes devuelve `[]`. Incluye título, empresa, descripción, ubicación, modalidad y las listas `requiredSkills`, `academicRequirements`, `otherRequirements`. No calcula un porcentaje de matching.

### `POST /api/job-connect/skills/extract`

```json
{"text":"Trabajé con Python y Machine Learning en San Simón"}
```

Respuesta HTTP 200:

```json
{"skills":["Python","Machine Learning"],"institutions":["UMSS"]}
```

Acepta texto vacío y hasta 20 000 caracteres. Usa reconocimiento por diccionario, no un modelo NLP entrenado ni detección de negaciones. No guarda etiquetas en experiencias laborales.

### `POST /api/job-connect/vacancies/:id/gap-analysis`

El ID debe ser un UUID de una vacante activa existente.

```json
{
  "skills": ["python", "JavaScript"],
  "academicQualifications": ["Ingeniería de Sistemas"],
  "submittedRequirements": ["Carta de motivación"]
}
```

Devuelve `vacancyId`, listas `skills`, `academicRequirements` y `otherRequirements` con `{name, status}` (`Cumple` o `Pendiente`), `missingSkills`, `complete` y `message`. Si todo se cumple, el mensaje es: «Para esta oportunidad no tienes habilidades ni requisitos pendientes». Las dos últimas listas del cuerpo son opcionales y por defecto están vacías. Las entradas inválidas generan 400; las vacantes inexistentes, inactivas o vencidas generan 404.

## Base de datos y verificación

Desde `backend`, con PostgreSQL disponible y `.env` configurado:

```powershell
pnpm exec prisma migrate deploy --config prisma7.config.ts
pnpm exec prisma generate --config prisma7.config.ts
pnpm build
pnpm test:cov
```

La migración `20261003040000_add_vacancies` añade una tabla sin modificar registros existentes. No crea ofertas de ejemplo. Para cargar ofertas, el módulo de administración/importación puede usar `prisma.vacancy.create` con título, empresa, descripción y requisitos. La consulta sola no permite crear, modificar o postular a vacantes.
