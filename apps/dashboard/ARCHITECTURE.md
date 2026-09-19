# AltLab Dashboard Architecture (`altlab-dashboard`)

This document describes the architectural principles, project structure, state management, and API integration strategy for `altlab-dashboard`.

---

## 1. Architectural Strategy

`altlab-dashboard` is built as a single-page application (SPA) using Vue 3 and TypeScript. The application follows clean architecture principles on the frontend:

- **Component Layer**: Presentational UI components and views built with Vue 3 `<script setup>`.
- **State Management Layer**: Centralized, modular reactive state using Pinia stores.
- **API Service Layer**: Typed HTTP abstraction layer calling `altlab-core` BFF endpoints.

---

## 2. Integration with `altlab-core` (BFF)

`altlab-dashboard` communicates strictly with the BFF endpoints provided by [`altlab-core`](file:///Users/aleksandr.trofimov/OwnProjects/altrof/AltLab/altlab-core/ARCHITECTURE.md):

```
+-------------------------------------------------------------+
|                      altlab-dashboard                       |
|                                                             |
|   [ Views / Pages ] -> [ Pinia Stores ] -> [ API Client ]   |
+-------------------------------------------------------------+
                               |
                               | HTTP / REST (BFF Contracts)
                               v
+-------------------------------------------------------------+
|               altlab-core (BFF Controllers)                 |
+-------------------------------------------------------------+
```

---

## 3. Directory Layout Blueprint

```
altlab-dashboard/
├── src/
│   ├── api/                   # API client wrappers & BFF contracts
│   │   ├── client.ts          # Axios / Fetch client instance with interceptors
│   │   └── modules/           # Endpoint-specific API services
│   │
│   ├── assets/                # Global styles, fonts, static assets
│   ├── components/            # Reusable UI components
│   │   ├── common/            # Buttons, modals, inputs, layout elements
│   │   └── modules/           # Domain-specific UI widgets
│   │
│   ├── composables/           # Shared Vue Composition functions
│   ├── layouts/               # Page layout wrappers (Default, Auth, Admin)
│   ├── router/                # Vue Router route definitions & navigation guards
│   ├── stores/                # Pinia state management modules
│   ├── views/                 # Top-level page components mapped to routes
│   │
│   ├── App.vue                # Root application component
│   └── main.ts                # Application setup & initialization
```

---

## 4. Component Library & Styling Strategy: PrimeVue v4 + Tailwind CSS

`altlab-dashboard` uses **PrimeVue v4** combined with **Tailwind CSS** for UI components and styling.

### Key Implementation Principles
1. **Unstyled / Aura Presets**: PrimeVue components utilize design tokens and Tailwind utility classes for consistent branding.
2. **Card Grid System**: Server cards, VM/Container metrics, and system overview panels are structured using responsive Tailwind grids (`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`).
3. **Light & Dark Theme Engine**: Theme switching is managed via PrimeVue theme configuration and Tailwind `dark:` class toggle attached to `<html>` or `<body>`.
4. **Data Tables & Badges**: Complex monitoring tables use PrimeVue `<DataTable>` with custom cell templates for status pills (`<Tag>`), badges, and action buttons.

---

## 5. Development Taboos & Architectural Constraints 🚫

To maintain clean code and prevent technical debt:

- 🚫 **No Inline Pixel Layout Offsets**: Do not hardcode dynamic layout coordinates or pixel offsets (e.g., `top: 142px`). Calculate container bounds dynamically or use CSS flex/grid.
- 🚫 **No Direct Component State Mutations from Outside**: Component props must remain immutable; state changes must be emitted via events or managed via Pinia stores.
- 🚫 **No Monolithic Vue Components**: Component files should focus on a single concern. Complex sub-views (e.g. Server Details Modal, VM List Item) must be extracted into dedicated components.
- 🚫 **No Un-themed Color Classes**: Never use fixed colors like `bg-white` or `text-black` without supplying corresponding dark variants (`dark:bg-gray-900`, `dark:text-white`).
