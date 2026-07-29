# Agile Command Center (ACC)

ACC transforms Jira Cloud into an enterprise Agile Operating System for executives, portfolio leaders, product teams, delivery organizations, and agile coaches.

## Iteration 1 scope

This repository establishes the production-oriented foundation instead of a throwaway MVP:

- Atlassian Forge global page using Custom UI.
- React + TypeScript frontend with a minimal command-center shell.
- Clean Architecture boundaries: domain, application services, ports, infrastructure adapters, and feature modules.
- Jira REST API adapter, Forge Storage repository, and swappable AI provider registry.
- Feature catalog for independently enabling ACC modules.
- Automated test, lint, format, Storybook, and GitHub Actions scaffolding.




## Master Specification

The highest authority for FlowOS is `docs/flowos-master-specification.md`. It governs product strategy, business architecture, domain model, enterprise UX, design system, AI operating model, intelligence model, platform architecture, security, commercial model, go-to-market, roadmap, and implementation governance.

## Product Blueprint

The official product blueprint is `docs/flowos-product-blueprint.md`. It defines FlowOS as the Enterprise Operating System for Strategy Execution and governs product vision, value proposition, customers, personas, business capabilities, journeys, workspaces, information architecture, object model, permissions, AI experience, intelligence scores, Marketplace strategy, competitive position, pricing, success metrics, and the five-year roadmap.

## Architecture Constitution

The product architecture has been refactored from a dashboard-centric app into a domain-driven enterprise platform. The governing architecture document is `docs/flowos-architecture-constitution.md`. It defines the root domains, bounded contexts, event model, Snapshot Engine, AI domain, Workforce domain, SLA Engine, workspaces, product split, risks, trade-offs, and refactoring plan.

## Enterprise architecture decisions

| Concern | Selected approach | Trade-off |
| --- | --- | --- |
| Jira integration | Native Jira REST and Agile APIs first | Avoids data duplication; advanced portfolio analytics can later sync into PostgreSQL. |
| Runtime | Forge Functions + Custom UI | Best Marketplace/security fit; complex long-running analytics may later move to remote backend. |
| Persistence | Forge Storage repository port | Simple tenancy and compliance now; repository abstraction prepares PostgreSQL. |
| AI | Provider registry port | Starts deterministic/testable; supports OpenAI, Claude, Gemini, and Llama adapters later. |
| UX | Linear/Atlassian-inspired cards and insights | Fast executive consumption; deeper drill-downs arrive per module. |

## Roadmap técnico

1. Delivery and Sprint Health domain metrics using Jira Agile API boards, sprints, and changelog data.
2. AI provider adapters for OpenAI first, with tenant-level model configuration and audit logging.
3. Portfolio, OKR, dependency graph, and executive report modules behind feature flags.
4. Confluence export, PDF/PPT generation, and scheduled weekly/monthly reports.
5. PostgreSQL read model for high-volume enterprise analytics and historical trends.


## MVP 1.0 deployment

The first installable increment is the Executive Workspace. It uses Jira Cloud APIs, Forge Storage snapshots, manual supplier configuration, configurable health score weights, and a concise executive brief.

### Deploy to Jira Cloud

```bash
npm install
npm run build
forge deploy
forge install
```

### Validate MVP value

After installation, open **FlowOS Executive Workspace** in Jira and confirm an executive can answer these four questions in less than 30 seconds:

1. What is the overall health of my organization?
2. Which team is at risk?
3. Which supplier needs attention?
4. What should I do today?

Use **FlowOS Configuration** in Jira administration to set the organization name, supplier account mappings, supplier capacity, health score weights, AI provider selection, refresh frequency, and feature flags.

## Commands

```bash
npm install
npm run build
npm run test
npm run lint
npm run format
```
