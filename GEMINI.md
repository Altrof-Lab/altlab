# AltLab Ecosystem — Unified Monorepo & BFF Platform

## 📌 Project Quick Overview
`altlab` is the central web dashboard and backend monorepo for the AltLab ecosystem. It hosts:
- `apps/core` — Modular Monolith backend & BFF built with NestJS, TypeScript, and Drizzle ORM.
- `apps/dashboard` — Management SPA built with Vue 3 (Composition API), Vite, Pinia, PrimeVue v4, and Tailwind CSS.
- `packages/shared` — Shared TypeScript DTOs, interfaces, and API contracts.

## 📂 Project Structure
- `apps/core/` — NestJS server (port `:3000`), Drizzle schemas, BFF controllers, service modules.
- `apps/dashboard/` — Vue 3 SPA (port `:5173`), PrimeVue v4 components, Tailwind CSS styling, dark mode engine.
- `packages/shared/` — Shared TypeScript schemas and contracts.

## 📚 Detailed Instructions & Guidelines
Before starting any sub-task, reference the appropriate guide:
- **Architecture & Data Flow:** Read [.agents/ARCHITECTURE.md](file://.agents/ARCHITECTURE.md)
- **Code Conventions & Styling:** Read [.agents/CODE_STYLE.md](file://.agents/CODE_STYLE.md)
- **GitHub & Issue Rules:** Read [.agents/GITHUB_WORKFLOW.md](file://.agents/GITHUB_WORKFLOW.md)

## ⚠️ Absolute Taboos
1. **No Duplicated Interfaces:** All shared DTOs, enums, and API contracts must be defined in `packages/shared/` and imported across apps.
2. **No Direct Non-BFF Requests:** `apps/dashboard` must communicate with internal or external services solely via `apps/core` BFF endpoints.
3. **No Hardcoded Pixel Offsets:** UI layout must use Tailwind flex/grid utility classes.
4. **Mandatory Dark Mode Support:** All UI styling must support dark mode (`dark:` variants).
5. **Assignee & Project Rules:** All GitHub issues must be prefixed with `[AL]`, assigned to `altrof`, and linked to the `Altrof Dev Dashboard` project.
