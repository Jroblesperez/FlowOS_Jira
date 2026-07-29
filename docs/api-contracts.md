# ACC API Contracts

## API strategy

The API strategy is defined by the [FlowOS Architecture Constitution](./flowos-architecture-constitution.md#20-api-strategy). FlowOS separates commands, queries, events, internal APIs, Forge APIs, external APIs, and AI APIs.

## Current Forge resolver

### `executive-dashboard.snapshot`

This Iteration 1 resolver remains as the current compatibility endpoint. During the architecture refactor it becomes a query over Snapshot Engine read models rather than a synchronous dashboard calculation.

## Refactoring rule

No new dashboard-oriented resolver should be added until the domain event model, snapshot query interfaces, and context ownership rules are in place.
