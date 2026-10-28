# AltLab System Architecture (`altlab`)

## 📌 Executive Overview
The `altlab` repository is the central monorepo of the AltLab platform, bringing together the modular backend/BFF (`apps/core`), the management frontend SPA (`apps/dashboard`), and unified cross-cutting contracts (`packages/shared`).

## 🗺️ Monorepo Architecture

```
altlab/
├── apps/
│   ├── core/              # NestJS + TypeScript + Drizzle ORM (Backend & BFF)
│   │   ├── src/
│   │   │   ├── database/  # Drizzle schema, connection, migrations
│   │   │   ├── modules/   # Feature modules (profiles, sessions, automation)
│   │   │   └── main.ts    # Application entry point (:3000)
│   │   └── package.json
│   │
│   └── dashboard/         # Vue 3 + Vite + PrimeVue v4 + Tailwind CSS (SPA)
│       ├── src/
│       │   ├── components/# Reusable UI widgets & cards
│       │   ├── views/     # Page views (Dashboard, Profiles, Bots, Logs)
│       │   ├── stores/    # Pinia state stores
│       │   └── main.ts    # Frontend entry point (:5173)
│       └── package.json
│
├── packages/
│   └── shared/            # Shared TypeScript DTOs, schemas & API contracts
│       ├── src/
│       │   ├── dto/       # Request / response payload interfaces
│       │   ├── enums/     # Shared domain enums
│       │   └── index.ts
│       └── package.json
│
├── pnpm-workspace.yaml    # Workspace definition
├── package.json           # Root scripts and dev dependencies
└── .agents/               # Agent & developer guidelines
```

## 🔄 Data & Communication Flow

```
[User Browser]
       │
       ▼
apps/dashboard (Vue 3 SPA on :5173)
       │ (REST / SSE / WebSockets)
       ▼
apps/core BFF (NestJS on :3000)
       ├──► Database (PostgreSQL via Drizzle ORM)
       ├──► SpyHub API (Anti-detect browser profiles on :52600)
       └──► BotForge API (Stealth audits & automation on :8080)
```

## 📦 Component Layer Responsibilities

### `apps/core` (Backend & BFF)
- **Framework**: NestJS 10+, TypeScript strict mode.
- **Architecture**: Modular Monolith — each domain feature is an isolated NestJS module with clear exports.
- **Data Access**: Drizzle ORM (`src/database/schema/`).
- **BFF Controllers**: Expose domain-tailored REST & streaming endpoints optimized specifically for the Dashboard UI.

### `apps/dashboard` (Frontend SPA)
- **Framework**: Vue 3 (Composition API with `<script setup lang="ts">`) + Vite + Pinia + Vue Router.
- **UI Components**: PrimeVue v4 + Tailwind CSS utility styling.
- **Theme Engine**: Complete dual-mode support (Light & Dark Theme) with persistent user preference.
- **Layout**: High-density monitoring data tables, responsive card grid system, real-time status badges.

### `packages/shared` (Shared Contracts)
- Single source of truth for DTO interfaces, validation schemas, status enums, and API response envelopes.
- Imported directly via `@altlab/shared` by both `apps/core` and `apps/dashboard`.

## ⚠️ Absolute Taboos & Constraints 🚫
1. **No Duplicated Interfaces**: Never redeclare models locally. DTOs and API payloads must be declared in `packages/shared` and imported.
2. **No Hardcoded Pixel Offsets**: All dynamic UI positioning must use Tailwind flex/grid utility classes.
3. **No Direct Non-BFF Requests**: `apps/dashboard` must communicate with internal or external services solely through `apps/core` BFF endpoints.
4. **Mandatory Dark Mode**: All UI styling must support dark mode (`dark:` variants).
