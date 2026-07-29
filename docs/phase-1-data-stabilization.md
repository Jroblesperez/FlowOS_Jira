# Phase 1 — Data Stabilization Decisions

## Scope

- Canonical model: `src/core/domain/executive.ts`.
- Pilot project: CPD — ECO Personas Deuna.
- Pilot board: Pays Genius, board ID 140.
- The Jira adapter remains permission-aware through `api.asUser()` during Phase 1.
- The deployed failure was confirmed as HTTP 410 on `POST /rest/api/3/search`; the pilot uses enhanced JQL search.
- Jira Software board and sprint operations are queried directly for board 140 and diagnosed independently.

## Semantic rules

Missing, inaccessible, or unconfigured data never becomes a score of zero or 100. Health is `unknown` when an evaluation cannot be completed. Source errors, insufficient data, incomplete configuration, partial coverage, and completed evaluations with no findings remain distinct states.

## Deferred strategic traceability

Phase 2 will use DSP — Delivery Strategic Prioritization as the initiative source. The Jira issue type is Iniciativa (ID 10135), with future traceability from DSP initiatives to features in ECO projects such as CPD, EMD, and ETT. Phase 1 does not extract or score this hierarchy.

## Legacy retirement

`src/core/domain/metrics.ts`, `ExecutiveDashboardService`, `SnapshotRepository`, and `ForgeSnapshotRepository` are legacy compatibility elements. They are not extended in Phase 1 and will be retired only after their remaining tests and consumers are migrated.

## Security decision pending

Snapshots are currently generated using the invoking user's Jira permissions and stored in a shared KVS key. A future common executive snapshot should be generated under a governed app identity and exposed only to authorized groups, subject to a dedicated Forge permissions and data-exposure review.
