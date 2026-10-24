# Propuesta de esquema: encuestas de empleabilidad

**Épica:** 10 - Analytics institucional
**Historia:** HU 6 - Crear encuesta (base para las HU 1 a 5: responder la encuesta y sus analíticas)
**Migración incluida:** `backend/prisma/migrations/20261022000000_add_surveys/migration.sql`

Esta propuesta queda sujeta a la revisión del equipo DevOps. La migración se generó con
`prisma migrate diff` contra el esquema de `develop` y solo se aplicó en una base Docker local
desechable. No se ejecutó contra ninguna base compartida.

## Modelos

| Modelo | Tabla | Descripción |
|---|---|---|
| `Survey` | `surveys` | Encabezado de la encuesta: título, descripción, carrera, gestión, vigencia, estado y creador. |
| `SurveyQuestion` | `survey_questions` | Preguntas cerradas ordenadas por `position`. |
| `SurveyQuestionOption` | `survey_question_options` | Opciones de cada pregunta, ordenadas por `position`. |

```prisma
enum SurveyStatus {
  DRAFT
  PUBLISHED
}

enum SurveyQuestionType {
  SINGLE_CHOICE
  MULTIPLE_CHOICE
}

model Survey {
  id             String       @id @default(uuid()) @db.Uuid
  title          String       @db.VarChar(150)
  description    String?      @db.VarChar(500)
  careerId       String?      @map("career_id") @db.Uuid
  academicPeriod String?      @map("academic_period") @db.VarChar(7)
  opensAt        DateTime?    @map("opens_at") @db.Timestamptz(6)
  closesAt       DateTime?    @map("closes_at") @db.Timestamptz(6)
  status         SurveyStatus @default(DRAFT)
  createdById    String       @map("created_by_id") @db.Uuid
  createdAt      DateTime     @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt      DateTime     @updatedAt @map("updated_at") @db.Timestamptz(6)

  career    Career?          @relation(fields: [careerId], references: [id], onDelete: Restrict)
  createdBy User             @relation("SurveyCreatedBy", fields: [createdById], references: [id], onDelete: Restrict)
  questions SurveyQuestion[]

  @@index([careerId, academicPeriod])
  @@index([createdById])
  @@index([status])
  @@map("surveys")
}

model SurveyQuestion {
  id         String             @id @default(uuid()) @db.Uuid
  surveyId   String             @map("survey_id") @db.Uuid
  position   Int
  statement  String             @db.VarChar(250)
  type       SurveyQuestionType
  isRequired Boolean            @default(true) @map("is_required")
  createdAt  DateTime           @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt  DateTime           @updatedAt @map("updated_at") @db.Timestamptz(6)

  survey  Survey                 @relation(fields: [surveyId], references: [id], onDelete: Cascade)
  options SurveyQuestionOption[]

  @@unique([surveyId, position])
  @@map("survey_questions")
}

model SurveyQuestionOption {
  id         String   @id @default(uuid()) @db.Uuid
  questionId String   @map("question_id") @db.Uuid
  position   Int
  label      String   @db.VarChar(100)
  createdAt  DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt  DateTime @updatedAt @map("updated_at") @db.Timestamptz(6)

  question SurveyQuestion @relation(fields: [questionId], references: [id], onDelete: Cascade)

  @@unique([questionId, position])
  @@map("survey_question_options")
}
```

Relaciones inversas agregadas:

```prisma
model User {
  // ...
  createdSurveys Survey[] @relation("SurveyCreatedBy")
}

model Career {
  // ...
  surveys Survey[]
}
```

## Decisiones

1. **Doble estándar.** Modelos en PascalCase singular, tablas en snake_case plural, campos en
   camelCase con `@map` a snake_case, PK `id` y FKs terminadas en `_id`.
2. **`academic_period` es `VARCHAR(7)` y no `VARCHAR(6)`.** El proyecto ya usa el formato
   `I-2026` / `II-2026` (`ACADEMIC_PERIOD_PATTERN` del módulo de reportes y `getAcademicPeriods()`
   del frontend). `II-2026` tiene 7 caracteres.
3. **Campos opcionales para borradores.** `career_id`, `academic_period`, `opens_at` y
   `closes_at` son opcionales porque un borrador solo exige el título. Al publicar, el backend los
   valida como obligatorios con Zod.
4. **Enums frente a catálogos.** Se usaron enums de Prisma porque los valores son cerrados y no
   necesitan seed. Si el equipo prefiere el patrón de catálogos (como `EventStatus`), el cambio es
   reemplazar los enums por las tablas `survey_statuses` y `survey_question_types` con un `title`
   único y sembrarlas en `seed:run`.
5. **Vigencia.** `opens_at` se guarda como las 00:00 y `closes_at` como las 23:59:59.999 del día
   elegido en America/La_Paz, así el último día queda incluido. Las HU 1 a 5 pueden filtrar las
   encuestas vigentes con `status = 'PUBLISHED' AND opens_at <= now() AND closes_at >= now()`.
6. **Borrado en cascada.** Al eliminar una encuesta se eliminan sus preguntas y opciones. No se
   puede eliminar una carrera ni un usuario que tengan encuestas (`RESTRICT`).
7. **Título único por carrera y gestión.** Se valida en el servicio sin distinguir mayúsculas
   (409). No se creó un índice único en base de datos porque PostgreSQL trata los `NULL` como
   distintos y los borradores pueden no tener carrera ni gestión. Si DevOps lo aprueba, se puede
   reforzar con un índice único funcional:

   ```sql
   CREATE UNIQUE INDEX surveys_title_career_period_key
     ON surveys (lower(title), career_id, academic_period) NULLS NOT DISTINCT;
   ```

## Consideraciones para las HU 1 a 5

- Las respuestas necesitarán una tabla `survey_responses` (`survey_id`, `user_id`, `submitted_at`,
  único por `survey_id` y `user_id`) y otra `survey_response_answers` (`response_id`,
  `question_id`, `option_id`) que permita varias filas por pregunta para opción múltiple.
- Los índices `surveys(career_id, academic_period)` y `surveys(status)` cubren las consultas de
  encuestas vigentes por carrera.
