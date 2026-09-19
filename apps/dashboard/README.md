# AltLab Dashboard (`altlab-dashboard`)

> Modern management dashboard frontend built with Vue 3, TypeScript, Vite, Pinia, and Vue Router.

## Overview

`altlab-dashboard` is the web client application for the AltLab platform. It provides a responsive, reactive user interface for interacting with centralized services hosted by [`altlab-core`](file:///Users/aleksandr.trofimov/OwnProjects/altrof/AltLab/altlab-core).

## Tech Stack

- **Framework**: [Vue 3](https://vuejs.org/) (Composition API, `<script setup>`)
- **Language**: TypeScript
- **Build Tool**: [Vite](https://vitejs.dev/)
- **State Management**: [Pinia](https://pinia.vuejs.org/)
- **Routing**: [Vue Router](https://router.vuejs.org/)
- **UI Components & Styling**: [PrimeVue v4](https://primevue.org/) + [Tailwind CSS](https://tailwindcss.com/)

## UI / UX Highlights

- **Light & Dark Theme**: Seamless switching between Light and Dark themes across all UI components and layouts.
- **Card Grid Layout**: Clean card-based system for server overview, VM/Container metrics, and system stats.
- **High Data Density**: Rich monitoring tables (`DataTable`) with status tags, IP/MAC badges, sorting, and filtering.

## Development Taboos & Constraints 🚫

To maintain high code quality and architectural integrity:

1. **No Hardcoded Styling**: Avoid inline CSS styles (e.g. `style="margin-top: 15px;"`). Use Tailwind utility classes and PrimeVue design tokens exclusively.
2. **No Monolithic Views**: Do not place massive UI structures in a single `.vue` file. Break views down into modular, single-responsibility components (`components/common/` or `components/modules/`).
3. **No Direct Non-BFF Requests**: All frontend network requests must go through typed API services calling `altlab-core` BFF endpoints. Never call raw databases or third-party APIs directly from UI components.
4. **No Theme Breaking**: All custom styling must explicitly support both Light and Dark modes. Test UI changes in both theme states.

## Documentation

For a detailed breakdown of frontend architecture, component layout, and BFF integration, refer to:
- [ARCHITECTURE.md](file:///Users/aleksandr.trofimov/OwnProjects/altrof/AltLab/altlab-dashboard/ARCHITECTURE.md)
