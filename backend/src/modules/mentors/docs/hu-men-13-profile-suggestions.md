# HU-MEN-13: sugerencias del perfil profesional

Issue: https://github.com/UMSSY/umssy-app/issues/2072

## Modelos y fuentes existentes

El mentor es un `User` vinculado al rol de mentor mediante `UserRole`.
`MentorsRepository.findActiveMentorById(userId, now)` ya consulta los datos
necesarios y exige usuario activo, rol de mentor sin eliminación y fecha de
inicio no posterior a `now`. La disponibilidad para mentorías no determina
la participación activa. Una solicitud pendiente u oferta tampoco la sustituye.

| Apartado | Fuente | Información faltante |
| --- | --- | --- |
| Fotografía | `User.photoUrl` (`Bytes?`) | `null` o binario de longitud cero |
| Descripción profesional | `User.aboutMe` (`String?`) | `null`, vacío o solo espacios |
| Especialidad | `User.mentorTechnicalAreas` | Ninguna relación con áreas técnicas |
| Experiencia laboral | `User.workExperiences` | Ningún registro laboral |

`headline` es el titular profesional, no la especialidad. No se exige una
descripción laboral opcional ni fecha final para una experiencia actual.
`ProfileService`, `ProfilePhotoService` y `WorkExperienceService` conservan
la responsabilidad de editar los datos. El evaluador solo los consultará.

## Contrato previsto

Cada sugerencia tendrá un código estable, un apartado y un mensaje específico.
El orden será fotografía, descripción, especialidad y experiencia. Los apartados
completos no generarán sugerencias; un perfil completo devolverá `[]`.
Un usuario que no sea mentor activo tampoco recibirá sugerencias.

La normalización se realizará únicamente en memoria. Las recomendaciones serán
independientes y opcionales, sin persistencia ni cambios de validaciones.

## Alcance y entrega incremental

No se modifican Prisma, migraciones, frontend, controladores ni endpoints.
Tampoco las reglas de participación, cupos, solicitudes u ofertas. El servicio
se registrará y exportará en `MentorsModule` en el bloque 3.

El bloque 1 prepara documentación, fixtures, tipos y normalización de texto.
La detección de apartados corresponde al bloque 2; el servicio al bloque 3;
las combinaciones, ausencia de escrituras y documentación final al bloque 4.
