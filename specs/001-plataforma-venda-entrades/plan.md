# Implementation Plan: Plataforma de Venda d'Entrades en Temps Real

**Branch**: `001-plataforma-venda-entrades` | **Date**: 2026-03-24 | **Spec**: specs/001-plataforma-venda-entrades/spec.md
**Input**: Feature specification from `/specs/001-plataforma-venda-entrades/spec.md`

## Summary

Plataforma de venda d'entrades en temps real per a esdeveniments d'alta demanda. El sistema permet als usuaris visualitzar esdeveniments, seleccionar i reservar seients temporalment, i completar compres. L'administrador pot gestionar esdeveniments i monitoritzar vendes en temps real. La concurrència es gestiona íntegrament des del servidor utilitzant Socket.io per a sincronització d'estat.

## Technical Context

**Language/Version**: Node.js 18+, Vue 3.4+, TypeScript 5.0+  
**Primary Dependencies**: Express, Socket.io, Pinia, Vue Router, Axios, Vitest, Playwright  
**Storage**: PostgreSQL (base de dades relacional per a esdeveniments, seients, reserves, entrades)  
**Testing**: Vitest (unit tests), Playwright (e2e tests), Cypress (per als tests de concurrència segons requeriments)  
**Target Platform**: Web (navegador modern)  
**Project Type**: Web-service + Web application (temps real)  
**Performance Goals**: 1000 usuaris simultanis, resposta d'error <500ms per a conflictes de reserves, propagació d'estat <1 segon  
**Constraints**: Tota la interfície i codi en català, sense CDN externs, gestió de reserves des del servidor  
**Scale/Scope**: 1 esdeveniment principal, fins a 1000 usuaris, plànol de seients amb zones

## Constitution Check

**GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.**

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Component-First Architecture | ✅ PASS | Nuxt 3 amb Vue 3 components reutilitzables |
| II. Responsive Design | ✅ PASS | Suport mobile/tablet/desktop |
| III. State Management | ✅ PASS | Pinia per a gestió d'estat global |
| IV. API-First Development | ✅ PASS | Contractes definits abans d'implementació |
| V. Test-Driven Development | ✅ PASS | Tests abans d'implementació (Vitest/Playwright) |
| VI. Server-Side Concurrency | ✅ PASS | Servidor gestiona reserves i bloqueig de seients |
| VII. Catalan Language | ✅ PASS | Tot el codi i interfície en català |

No hi ha violacions que requereixin justificació.

## Project Structure

### Documentation (this feature)

```text
specs/001-plataforma-venda-entrades/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── models/          # Models de dades (Sequelize/Prisma)
│   ├── services/       # Lògica de negoci
│   ├── api/            # Controladors REST
│   ├── socket/         # Handlers de Socket.io
│   └── utils/         # Utilitats
├── tests/
│   └── unit/          # Tests de unitat
└── package.json

frontend/               # Nuxt 3 app
├── src/
│   ├── components/     # Vue components
│   ├── pages/         # Pàgines Nuxt
│   ├── composables/   # Lògica reusable (Composition API)
│   ├── stores/        # Pinia stores
│   ├── services/     # Client API/Socket
│   └── assets/       # Estils
├── tests/
│   ├── unit/          # Vitest
│   └── e2e/           # Playwright
└── package.json
```

**Structure Decision**: Web application amb backend Node.js/Express + frontend Nuxt 3. Socket.io s'integra al mateix servidor backend per a temps real.

## Complexity Tracking

No hi ha violacions de la constitució que requereixin justificació.
