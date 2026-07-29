# ACC Architecture


## Master specification

The highest authority for FlowOS is the [FlowOS Master Specification](./flowos-master-specification.md). Architecture, implementation, UX, AI, APIs, Marketplace modules, and source code must conform to it unless changed by an approved ADR.

## Product blueprint

The product authority for FlowOS is the [FlowOS Product Blueprint](./flowos-product-blueprint.md). It defines the business architecture and product strategy that the technical architecture must serve.

## Architecture status

The architecture authority for the product is now the [FlowOS Architecture Constitution](./flowos-architecture-constitution.md). That document supersedes dashboard-centric architecture decisions and defines FlowOS as a domain-driven enterprise platform.

## Architectural north star

ACC is the Jira Cloud experience layer for the broader FlowOS platform. The platform is organized around business domains, bounded contexts, events, snapshots, AI governance, tenant administration, and Marketplace-ready delivery.

Dashboards, reports, workspaces, and AI chat are projections over domain snapshots. They must not own business rules or calculate enterprise KPIs in request paths.

## Current repository alignment

The current code remains a Forge + React + TypeScript foundation. Future implementation must refactor toward the constitution in this order:

1. Introduce domain-first folders and shared kernel.
2. Add domain event envelope and event repository ports.
3. Move KPI calculation into the Snapshot Engine.
4. Convert dashboard reads into snapshot queries.
5. Add Workforce, Supplier, SLA, and AI domain contracts before adding new UI.

## Security baseline

- Least-privilege Forge scopes.
- Tenant-isolated storage and event keys.
- Permission-aware queries through the Identity context.
- AI evidence scoping, prompt audit, and model routing policies.
- Immutable audit records for business decisions and generated recommendations.
