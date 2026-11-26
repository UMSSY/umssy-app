# Orientation types

This backend catalog serves the types of orientation used by the mentorship flow.

## Rules and dependencies

The endpoint reads shared catalog records. Mentorship clients use the identifiers when working with orientation selections.

## HTTP contract

- `GET /orientation-types`

## Main flow

```mermaid
sequenceDiagram
  participant C as Client
  participant M as Module API
  C->>M: Request orientation type catalog
  M-->>C: Return available orientation types
```

## Sprint History

### Sprint 3

This backend catalog serves the types of orientation used by the mentorship flow.
