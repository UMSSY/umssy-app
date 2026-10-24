# Contrato de datos: Epic 4 → Epic 5 (HU-02A)

## Fecha de congelamiento
D5 (23-oct-2026)

## Campos que Epic 4 debe agregar a JobOffer (vía Database/DevOps)
- `requiredCareer: string | null` — Carrera requerida
- `minimumExperienceYears: number` — Años mínimos de experiencia (default: 0)
- `location: string | null` — Ciudad de la vacante
- `otherRequirements: string[]` — Otros requisitos (ej. carta de motivación)

## Formato de respuesta acordado

### GET /job-offers/recommendations
{ isProfileComplete: boolean, items: [{ id, title, company, modality, location, matchPercentage, skills }] }

### GET /job-offers/:id/match (T3.4)
{ score: number, requirements: RequirementState[], hasPendingRequirements: boolean }

## Responsables
- Epic 4: [nombre del contacto]
- Epic 5: Fernando Vásquez
- Database/DevOps: [nombre del contacto]

## Estado
Pendiente de aprobación por Epic 4 y Database/DevOps.