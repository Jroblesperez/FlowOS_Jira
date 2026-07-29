# ACC Data Model

## Canonical model

The canonical enterprise data model is defined in the [FlowOS Architecture Constitution](./flowos-architecture-constitution.md#5-data-model). It includes the conceptual ER diagram, ownership rules, lifecycle responsibilities, and domain-level retention rationale.

## Refactoring direction

The initial `executive-snapshot:{tenantId}` document remains valid as the current Iteration 1 storage shape. It evolves into versioned Snapshot Engine records owned by domain contexts rather than by dashboard code.

Future persistence separates:

- Domain aggregates.
- Immutable domain events.
- Normalized facts.
- Historical snapshots.
- Read models.
- AI audit and evidence packages.
