# Files

This internal backend module validates, persists and retrieves files for business modules that handle uploads.

## Rules and dependencies

FilesService applies the configured size and type rules. FilesRepository stores file information through Prisma. Feature controllers own the public HTTP routes.

## Main flow

```mermaid
sequenceDiagram
  participant C as Caller
  participant M as Service
  C->>M: Validate and store uploaded file
  M-->>C: Return file metadata
```

## Sprint History

### Sprint 3

This internal backend module validates, persists and retrieves files for business modules that handle uploads.
