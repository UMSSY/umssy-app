# Propuesta: Tabla de postulaciones (D-02)

## Modelo Prisma sugerido

model JobApplication {
  id         String   @id @default(uuid()) @db.Uuid
  userId     String   @map("user_id") @db.Uuid
  jobOfferId String   @map("job_offer_id") @db.Uuid
  statusId   String   @map("status_id") @db.Uuid
  createdAt  DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt  DateTime @updatedAt @map("updated_at") @db.Timestamptz(6)

  user     User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  jobOffer JobOffer       @relation(fields: [jobOfferId], references: [id], onDelete: Cascade)
  status   ApplicationStatus @relation(fields: [statusId], references: [id], onDelete: Restrict)

  @@unique([userId, jobOfferId])
  @@index([jobOfferId])
  @@index([statusId])
  @@map("job_applications")
}

model ApplicationStatus {
  id        String   @id @default(uuid()) @db.Uuid
  title     String   @unique @db.VarChar(100)
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt DateTime @updatedAt @map("updated_at") @db.Timestamptz(6)

  applications JobApplication[]

  @@map("application_statuses")
}

## Estados iniciales (seed)
- "En revisión"
- "Entrevista"
- "Aceptada"
- "No seleccionado"
- "Retirada" (para HU-05)

## Restricciones
- Un usuario no puede postularse dos veces a la misma vacante (unique).
- Si se elimina la vacante o el usuario, las postulaciones se eliminan en cascada.