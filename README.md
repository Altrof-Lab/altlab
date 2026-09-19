# AltLab Ecosystem (`altlab`)

> Centralized Lab Space Monorepo containing the NestJS backend (`apps/core`), Vue 3 dashboard frontend (`apps/dashboard`), and shared TypeScript contracts (`packages/shared`).

## Overview

`altlab` is the unified repository for the AltLab ecosystem. It hosts:
- **`apps/core`**: Modular Monolith backend & BFF built with NestJS, TypeScript, and Drizzle ORM.
- **`apps/dashboard`**: Modern management SPA built with Vue 3, Vite, Pinia, Vue Router, PrimeVue v4, and Tailwind CSS.
- **`packages/shared`**: Shared DTOs, schemas, and API contracts used seamlessly across backend and frontend.

## Quick Start

### Installation

```bash
# Clone repository
git clone git@github.com:Altrof-Lab/altlab.git
cd altlab

# Install dependencies for all workspace apps
npm install
```

### Local Development

Start both `apps/core` (NestJS on `:3000`) and `apps/dashboard` (Vite on `:5173`) in parallel with a single command:

```bash
npm run dev
```

## Documentation

For full architectural details, module boundaries, and BFF integration rules, see:
- [ARCHITECTURE.md](file:///Users/aleksandr.trofimov/OwnProjects/altrof/AltLab/altlab/ARCHITECTURE.md)
