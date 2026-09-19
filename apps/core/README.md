# AltLab Core (`altlab-core`)

> Centralized backend & BFF service built on NestJS and TypeScript using Modular Monolith architecture.

## Overview

`altlab-core` is the foundational backend application for the AltLab ecosystem. It functions both as the primary domain core and as a dedicated Backend-For-Frontend (BFF) for `altlab-dashboard`. It is designed as a **Modular Monolith** to maintain strict domain boundaries, high performance, and ease of deployment without the distributed complexity of microservices.

## Tech Stack

- **Framework**: [NestJS](https://nestjs.com/) (TypeScript)
- **Runtime**: Node.js
- **Architecture**: Modular Monolith + BFF Pattern
- **Database / ORM**: [Drizzle ORM](https://orm.drizzle.team/) (TypeScript-first, lightweight, type-safe SQL query builder)
- **API Formats**: REST / JSON (OpenAPI / Swagger)

## Quick Start

*(Project setup instructions will be updated upon initial repository scaffolding)*

```bash
# Install dependencies
npm install

# Start development server
npm run start:dev
```

## Documentation

For a detailed breakdown of system design, domain module structure, and BFF architecture, refer to:
- [ARCHITECTURE.md](file:///Users/aleksandr.trofimov/OwnProjects/altrof/AltLab/altlab-core/ARCHITECTURE.md)
