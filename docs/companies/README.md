# Companies

The company fixture module provides organization records for local development and seed scenarios.

## Rules and dependencies

The fixture seeder uses Prisma Company records. It provides no standalone controller or frontend screen.

## Main flow

```mermaid
sequenceDiagram
  participant C as Caller
  participant M as Service
  C->>M: Run company fixture seed
  M-->>C: Persist company fixtures
```

## Sprint History

### Sprint 3

The company fixture module provides organization records for local development and seed scenarios.
