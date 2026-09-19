# AltLab Core Architecture (`altlab-core`)

This document describes the architectural principles, directory layout, and design patterns governing `altlab-core`.

---

## 1. Architectural Strategy: Modular Monolith

`altlab-core` is built as a **Modular Monolith**. All core features reside within a single deployable unit (NestJS application), but source code is strictly divided into decoupled, encapsulated domain modules.

### Key Rules
1. **Module Independence**: Each domain module (`src/modules/<domain>`) encapsulates its own business logic, services, and data models.
2. **Strict Public APIs**: Modules expose explicit services/interfaces for other modules to consume. Direct cross-module internal database coupling is prohibited.
3. **In-Memory Event Bus**: Loose coupling between modules is maintained via NestJS Event Emitter / internal events where applicable.

---

## 2. Dual Role: Core Domain + BFF (Backend-For-Frontend)

`altlab-core` fulfills two complementary responsibilities:

```
+-------------------------------------------------------------------+
|                        altlab-dashboard (UI)                      |
+-------------------------------------------------------------------+
                                  |
                                  | HTTP / REST (BFF Contracts)
                                  v
+-------------------------------------------------------------------+
|                          altlab-core                              |
|                                                                   |
|  [ BFF Layer ]                                                    |
|  - Request aggregation & formatting for dashboard UI               |
|  - Dashboard-specific DTOs & Validation                           |
|                                                                   |
|  [ Domain Core Layer ]                                            |
|  - Domain Business Logic & Rules                                  |
|  - Identity, Auth, System Services                                |
|  - Persistence & Integration Connectors                           |
+-------------------------------------------------------------------+
```

- **BFF Controllers (`src/bff/`)**: Expose API endpoints custom-tailored for `altlab-dashboard` UI screens. Aggregate data from multiple domain services to minimize client roundtrips.
- **Domain Services (`src/modules/`)**: Contain true business logic, independent of UI presentation rules.

---

## 3. Directory Layout Blueprint

```
altlab-core/
├── src/
│   ├── bff/                   # Backend-For-Frontend controllers & aggregators
│   │   ├── dashboard/         # Aggregated endpoints for main dashboard UI
│   │   └── common/            # BFF shared DTOs & interceptors
│   │
│   ├── modules/               # Modular Monolith Domain Modules
│   │   ├── auth/              # Authentication & User Identity
│   │   ├── system/            # System configuration & health
│   │   └── [domain-feature]/  # Business domain features
│   │
│   ├── common/                # Shared utilities, filters, decorators, guards
│   ├── database/              # DB connection, migrations, ORM configuration
│   ├── app.module.ts          # Main application root module
│   └── main.ts                # Application entrypoint
```

---

## 4. Database & ORM Strategy: Drizzle ORM

`altlab-core` uses **Drizzle ORM** as its data access layer.

### Key Architecture Decisions for Drizzle ORM
1. **Schema Definitions in TypeScript (`src/database/schema/`)**: Tables, relations, and schemas are defined natively in TypeScript code, providing full type safety across domain modules.
2. **NestJS Injection & Provider**: Drizzle instance is injected as a custom provider (`DRIZZLE_CLIENT`) into NestJS module repositories or domain services.
3. **Migration Workflow (`drizzle-kit`)**: Schema changes are managed via `drizzle-kit` SQL migrations stored in `src/database/migrations/`.
4. **Domain Repositories**: Domain modules encapsulate Drizzle queries within repository classes/services to keep business logic decoupled from query building details.
