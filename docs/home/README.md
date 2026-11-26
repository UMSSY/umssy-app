# Home

The public landing page presents the community, workshops and access links. The authenticated dashboard provides navigation to areas available to the current role.

## Rules and dependencies

The landing page delegates workshop loading to events. The dashboard uses the authenticated app shell and role navigation. Access and workshop calls to action use the shared button shape and retain their public-facing colors.

## Main flow

```mermaid
sequenceDiagram
  participant C as Client
  participant M as Service
  C->>M: Open the public home page
  M-->>C: Render community content and workshop section
```

## Sprint History

### Sprint 3

The mentor card on the dashboard keeps its page gutters and wraps the explore link below the description when the two no longer fit side by side.

The public landing page presents the community, workshops and access links. The authenticated dashboard provides navigation to areas available to the current role.
