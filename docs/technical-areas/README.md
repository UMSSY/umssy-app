# Technical areas

The technical-area catalog supplies selectable areas for mentor registration and participation.

## Rules and dependencies

The backend serves catalog data and the mentorship flows consume it. The controller exposes a read endpoint.

## HTTP contract

- `GET /technical-areas`

## Main flow

```mermaid
sequenceDiagram
  participant C as Client
  participant M as Module API
  C->>M: Request the technical area catalog
  M-->>C: Return available areas
```

## Sprint History

### Sprint 3

The technical-area catalog supplies selectable areas for mentor registration and participation.
