# AltLab Code Conventions & Style Guide

## 📌 General Principles
- **Language**: English for all code symbols, comments, docstrings, commit messages, and PRs.
- **TypeScript**: Strict mode enabled across all apps and packages. Never use `any` — use `unknown` with type guards, generic parameters, or explicit interfaces.
- **Package Imports**: Use workspace aliases:
  - `@altlab/shared` for shared contracts.
  - `@/*` for intra-app path aliases.

---

## 🛠️ Backend (`apps/core`) — NestJS & Drizzle ORM

### 1. Controllers & BFF
- Keep controllers thin. They should handle validation, call service methods, and format response envelopes.
- Explicit return types are required on all controller methods.
- Use NestJS validation pipes with `class-validator` / `zod` for incoming payloads.

### 2. Services & Dependency Injection
- Encapsulate business logic in injectable services.
- Never write raw queries directly in controllers; all database operations must go through Drizzle repositories/services.

### 3. Drizzle ORM Guidelines
- Define schemas in `src/database/schema/` grouped by domain (e.g. `profiles.ts`, `tasks.ts`).
- Export both the table schema and inferred TypeScript types (`InferSelectModel`, `InferInsertModel`).
- Migrations must be committed and version-controlled via Drizzle Kit.

---

## 🎨 Frontend (`apps/dashboard`) — Vue 3 & Tailwind CSS

### 1. Component Structure
- Always use the Composition API with `<script setup lang="ts">`.
- Standard block ordering:
  1. `<script setup lang="ts">`
  2. `<template>`
  3. `<style scoped>` (only if Tailwind utilities are insufficient)

### 2. State Management (Pinia)
- Use Setup Stores syntax (`defineStore('name', () => { ... })`).
- Keep asynchronous API calls inside store actions; views should only bind to store state and dispatch actions.

### 3. UI, PrimeVue v4 & Tailwind CSS
- **Design Tokens**: Rely on Tailwind utility classes and PrimeVue semantic classes.
- **Theme Support**: Every UI component MUST support dark mode. Always pair background and text colors:
  ```html
  <div class="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
  ```
- **Accessibility**: Provide meaningful ARIA labels for icon-only buttons.
