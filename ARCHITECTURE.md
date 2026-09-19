# AltLab System Architecture (`altlab`)

This document outlines the architectural strategy, directory structure, and technical constraints for the `altlab` monorepo.

---

## 1. Monorepo Architecture

```
altlab/
├── apps/
│   ├── core/              # NestJS + Drizzle ORM (Backend & BFF)
│   └── dashboard/         # Vue 3 + PrimeVue v4 + Tailwind CSS (Frontend SPA)
│
├── packages/
│   └── shared/            # Shared TypeScript DTOs & API Contracts
│
├── package.json           # Root workspace configuration
├── pnpm-workspace.yaml    # Workspace definition
└── ARCHITECTURE.md        # System Architecture Spec
```

---

## 2. Component Layer Responsibilities

### `apps/core` (Backend & BFF)
- **Framework**: NestJS + TypeScript
- **Architecture**: Modular Monolith
- **Data Access**: Drizzle ORM (`src/database/schema/`)
- **BFF Controllers**: Expose tailored API endpoints for `apps/dashboard` UI.

### `apps/dashboard` (Frontend SPA)
- **Framework**: Vue 3 (Composition API) + Vite + Pinia + Vue Router
- **UI Components**: PrimeVue v4 + Tailwind CSS
- **Features**: Light & Dark Theme engine, Card Grid layout system, high data density monitoring tables.

### `packages/shared` (Shared Contracts)
- Holds shared TypeScript interfaces, DTOs, and enum definitions. Used directly in both `apps/core` and `apps/dashboard` to ensure end-to-end type safety.

---

## 3. Development Taboos & Constraints 🚫

1. **No Duplicated Interfaces**: DTOs and API payloads must be declared in `packages/shared` and imported in both apps.
2. **No Hardcoded Pixel Offsets**: All dynamic UI positioning must use Tailwind flex/grid utility classes.
3. **No Non-BFF Direct API Requests**: `apps/dashboard` must call `apps/core` BFF endpoints exclusively.
4. **No Single-Theme Color Classes**: Custom CSS/Tailwind classes must support Dark Mode (`dark:`).
